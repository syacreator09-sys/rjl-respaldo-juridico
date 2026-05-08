import { z } from 'zod'

export const PublicChatSchema = z.object({
  message: z.string().min(1).max(1000).trim(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(20).default([]),
  sessionId: z.string().uuid().optional(),
})

export const ClientChatSchema = z.object({
  message: z.string().min(1).max(1000).trim(),
  caseId: z.string().uuid(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(50).default([]),
})

export const AnalyzeCaseSchema = z.object({
  caseId: z.string().uuid(),
})

export type PublicChatInput = z.infer<typeof PublicChatSchema>
export type ClientChatInput = z.infer<typeof ClientChatSchema>
