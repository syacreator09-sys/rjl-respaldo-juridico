// NVIDIA NIM — OpenAI-compatible inference API
// Provides DeepSeek V4 Pro/Flash, Llama 4, Mistral Large and more
// Docs: https://docs.api.nvidia.com/nim/reference/deepseek-ai-deepseek-v4-pro

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'

// Models available on NVIDIA NIM (confirmed 2026-05-10)
export const NVIDIA_MODELS = {
  deepseekV4Pro:   'deepseek-ai/deepseek-v4-pro',    // Best quality — use for premium
  deepseekV4Flash: 'deepseek-ai/deepseek-v4-flash',  // Faster + cheaper — use for free tier
  llama4Maverick:  'meta/llama-4-maverick-17b-128e-instruct', // Fast fallback
  llama33_70b:     'meta/llama-3.3-70b-instruct',    // Reliable fallback
} as const

export type NvidiaModel = typeof NVIDIA_MODELS[keyof typeof NVIDIA_MODELS]

interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface NvidiaChatRequest {
  model: NvidiaModel
  messages: NvidiaMessage[]
  max_tokens?: number
  temperature?: number
  stream?: false
}

interface NvidiaChatResponse {
  choices: Array<{
    message: { role: string; content: string }
    finish_reason: string
  }>
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export async function nvidiaChat(req: NvidiaChatRequest): Promise<{ reply: string; model: string }> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey || apiKey.startsWith('PENDIENTE')) {
    throw new Error('NVIDIA_NIM_API_KEY is not configured.')
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      max_tokens: req.max_tokens ?? 1200,
      temperature: req.temperature ?? 0.6,
      stream: false,
    } satisfies NvidiaChatRequest),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => response.statusText)
    throw new Error(`NVIDIA NIM error ${response.status}: ${errBody.slice(0, 200)}`)
  }

  const data = (await response.json()) as NvidiaChatResponse
  const reply = data.choices[0]?.message?.content ?? ''
  return { reply, model: req.model }
}
