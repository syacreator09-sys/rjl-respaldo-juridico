import Anthropic from '@anthropic-ai/sdk'
import { cloudflareChat, type AiMessage } from './cloudflare'
import { nvidiaChat } from './nvidia-nim'
import { retrieveLegalContext } from '../knowledge/legal-retrieval'
import { SYSTEM_PROMPTS } from '../anthropic'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const anthropic = ANTHROPIC_KEY && !ANTHROPIC_KEY.startsWith('PENDIENTE')
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : null

export type ChatTier = 'free' | 'premium'

interface ChatRequest {
  tier: ChatTier
  userMessage: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  caseData?: Record<string, unknown>
  maxTokens?: number
}

export async function routeChat(req: ChatRequest): Promise<{ reply: string; model: string }> {
  const legalCtx = retrieveLegalContext(req.userMessage)
  const maxTokens = req.maxTokens ?? (req.tier === 'free' ? 800 : 1200)

  if (req.tier === 'premium') {
    if (!anthropic) {
      // No Claude key — degradar premium a free path en vez de crashear
      console.warn('[router] Premium tier requested but ANTHROPIC_API_KEY not configured; falling back to free tier')
    } else {
      const system = (req.caseData ? SYSTEM_PROMPTS.clientChat(req.caseData) : SYSTEM_PROMPTS.publicChat) + legalCtx
      const messages = [...req.history, { role: 'user' as const, content: req.userMessage }]
      const resp = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system, messages })
      const reply = resp.content[0].type === 'text' ? resp.content[0].text : ''
      return { reply, model: 'claude-sonnet-4-6' }
    }
  }

  const system = SYSTEM_PROMPTS.publicChat + legalCtx
  const msgs: AiMessage[] = [...req.history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })), { role: 'user' as const, content: req.userMessage }]

  try {
    const reply = await cloudflareChat(system, msgs, maxTokens)
    return { reply, model: 'cloudflare/llama-3.3-70b' }
  } catch (cfErr) {
    console.warn('[router] Cloudflare failed, NVIDIA NIM fallback:', cfErr)
    try {
      const reply = await nvidiaChat(system, req.history.concat([{ role: 'user', content: req.userMessage }]), maxTokens)
      return { reply, model: 'nvidia/llama-3.3-70b' }
    } catch (nvErr) {
      // Free tier: si no hay Claude o falla → no se billea, error explícito
      if (!anthropic) {
        console.error('[router] Both free providers failed and no Claude key:', nvErr)
        throw new Error('AI providers unavailable. Try again in a moment.')
      }
      // Solo cae a Claude Haiku si premium tier originalmente o si key existe (control de costos)
      if (req.tier !== 'premium') {
        throw new Error('AI providers unavailable. Try again in a moment.')
      }
      console.error('[router] NVIDIA also failed, Claude Haiku last resort:', nvErr)
      const resp = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, system: SYSTEM_PROMPTS.publicChat + legalCtx, messages: msgs as Anthropic.MessageParam[] })
      const reply = resp.content[0].type === 'text' ? resp.content[0].text : 'Error temporal.'
      return { reply, model: 'claude-haiku-fallback' }
    }
  }
}
