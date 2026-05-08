const NVIDIA_KEY = process.env.NVIDIA_NIM_API_KEY!

export async function nvidiaChat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, maxTokens = 800): Promise<string> {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'meta/llama-3.3-70b-instruct', messages: [{ role: 'system', content: system }, ...messages], max_tokens: maxTokens, temperature: 0.2, stream: false }),
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`NVIDIA NIM ${response.status}: ${await response.text()}`)
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('NVIDIA NIM: respuesta vacía')
  return text
}
