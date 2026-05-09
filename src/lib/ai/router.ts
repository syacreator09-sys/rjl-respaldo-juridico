import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL, SYSTEM_PROMPTS } from '../anthropic'
import { retrieveLegalContext } from '../knowledge/legal-retrieval'

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
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY is not configured.')
  }

  const legalCtx = retrieveLegalContext(req.userMessage)
  const maxTokens = req.maxTokens ?? (req.tier === 'free' ? 800 : 1200)
  const system =
    (req.caseData && req.tier === 'premium'
      ? SYSTEM_PROMPTS.clientChat(req.caseData)
      : SYSTEM_PROMPTS.publicChat) + legalCtx

  const messages = [...req.history, { role: 'user' as const, content: req.userMessage }]
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: messages as Anthropic.MessageParam[],
  })

  const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''
  return { reply, model: CLAUDE_MODEL }
}
