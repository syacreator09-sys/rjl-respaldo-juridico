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

export const EvidenceUploadSchema = z.object({
  caseId: z.string().uuid(),
  category: z.enum([
    'entrada_trabajo',
    'salida_trabajo',
    'contrato',
    'recibo_pago',
    'gastos_medicos',
    'cambio_domicilio',
    'otro',
  ]),
  gpsLat: z.number().min(-90).max(90).nullable(),
  gpsLng: z.number().min(-180).max(180).nullable(),
  gpsAccuracy: z.number().min(0).max(10000).nullable(),
})

export type PublicChatInput = z.infer<typeof PublicChatSchema>
export type ClientChatInput = z.infer<typeof ClientChatSchema>
