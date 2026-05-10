// AI Router — routes chat requests to the best available model
// Priority: NVIDIA DeepSeek V4 (primary) → Anthropic Claude (fallback if key configured)
//
// Tier logic:
//   free    → DeepSeek V4 Flash (fast, cost-efficient)
//   premium → DeepSeek V4 Pro   (most capable)
//   Both tiers fall back to Anthropic if ANTHROPIC_API_KEY is set and NVIDIA fails

import { nvidiaChat, NVIDIA_MODELS } from './nvidia'
import { SYSTEM_PROMPTS } from '../anthropic'
import { retrieveLegalContext } from '../knowledge/legal-retrieval'

export type ChatTier = 'free' | 'premium'

interface ChatRequest {
  tier: ChatTier
  userMessage: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  caseData?: Record<string, unknown>
  maxTokens?: number
}

// ─── Try NVIDIA NIM (primary) ─────────────────────────────────────────────────

async function tryNvidia(
  req: ChatRequest,
  system: string,
): Promise<{ reply: string; model: string }> {
  const model = req.tier === 'premium' ? NVIDIA_MODELS.deepseekV4Pro : NVIDIA_MODELS.deepseekV4Flash
  const maxTokens = req.maxTokens ?? (req.tier === 'free' ? 900 : 1400)

  const messages = [
    { role: 'system' as const, content: system },
    ...req.history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: req.userMessage },
  ]

  return nvidiaChat({ model, messages, max_tokens: maxTokens })
}

// ─── Try Anthropic Claude (fallback) ─────────────────────────────────────────

async function tryAnthropic(
  req: ChatRequest,
  system: string,
): Promise<{ reply: string; model: string } | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.startsWith('PENDIENTE')) return null

  // Lazy import to avoid crashing when key is not set
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const { CLAUDE_MODEL } = await import('../anthropic')

  const client = new Anthropic({ apiKey: key })
  const maxTokens = req.maxTokens ?? (req.tier === 'free' ? 800 : 1200)

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [
      ...req.history,
      { role: 'user', content: req.userMessage },
    ] as Array<{ role: 'user' | 'assistant'; content: string }>,
  })

  const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''
  return { reply, model: CLAUDE_MODEL }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function routeChat(req: ChatRequest): Promise<{ reply: string; model: string }> {
  const legalCtx = retrieveLegalContext(req.userMessage)
  const system =
    (req.caseData && req.tier === 'premium'
      ? SYSTEM_PROMPTS.clientChat(req.caseData)
      : SYSTEM_PROMPTS.publicChat) + legalCtx

  // 1. Try NVIDIA NIM (DeepSeek V4 Pro / Flash)
  if (process.env.NVIDIA_NIM_API_KEY && !process.env.NVIDIA_NIM_API_KEY.startsWith('PENDIENTE')) {
    try {
      return await tryNvidia(req, system)
    } catch (err) {
      console.error('[rjl:router] NVIDIA NIM failed, trying fallback:', err instanceof Error ? err.message : String(err))
    }
  }

  // 2. Fallback: Anthropic Claude (if key is configured)
  try {
    const result = await tryAnthropic(req, system)
    if (result) return result
  } catch (err) {
    console.error('[rjl:router] Anthropic fallback failed:', err instanceof Error ? err.message : String(err))
  }

  throw new Error('No AI provider is available. Configure NVIDIA_NIM_API_KEY or ANTHROPIC_API_KEY.')
}
