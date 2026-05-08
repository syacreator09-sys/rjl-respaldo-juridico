const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID!
const CF_TOKEN = process.env.CLOUDFLARE_AI_TOKEN!
const CF_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

export interface AiMessage { role: 'user' | 'assistant' | 'system'; content: string }

export async function cloudflareChat(system: string, messages: AiMessage[], maxTokens = 800): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/${CF_MODEL}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: system }, ...messages], max_tokens: maxTokens, stream: false }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Cloudflare AI ${response.status}: ${await response.text()}`)
  const data = await response.json() as { result?: { response?: string } }
  const text = data?.result?.response?.trim()
  if (!text) throw new Error('Cloudflare AI: respuesta vacía')
  return text
}
