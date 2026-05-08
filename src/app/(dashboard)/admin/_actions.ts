'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './_lib/admin-auth'

const USER_ROLES = new Set(['cliente', 'asesor', 'admin'])
const TICKET_STATUSES = new Set(['open', 'in_progress', 'closed'])
const TICKET_PRIORITIES = new Set(['low', 'medium', 'high'])

function revalidateAdminSurface() {
  revalidatePath('/admin')
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/asignar')
  revalidatePath('/admin/tickets')
  revalidatePath('/admin/config')
}

export async function updateUserAction(formData: FormData) {
  const { user } = await requireAdmin()
  const supabase = await createClient()
  const userId = formData.get('userId')?.toString()
  const role = formData.get('role')?.toString()
  const isActive = formData.get('isActive')?.toString() === 'true'

  if (!userId || !role || !USER_ROLES.has(role)) {
    return
  }

  if (userId === user.id && (!isActive || role !== 'admin')) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('profiles')
    .update({
      role,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  revalidateAdminSurface()
}

export async function assignCaseAction(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const caseId = formData.get('caseId')?.toString()
  const asesorIdRaw = formData.get('asesorId')?.toString()

  if (!caseId) {
    return
  }

  const asesorId = asesorIdRaw && asesorIdRaw !== 'unassigned' ? asesorIdRaw : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('cases')
    .update({
      asesor_id: asesorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId)

  revalidateAdminSurface()
}

export async function updateTicketAction(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const ticketId = formData.get('ticketId')?.toString()
  const status = formData.get('status')?.toString()
  const priority = formData.get('priority')?.toString()
  const asesorIdRaw = formData.get('asesorId')?.toString()

  if (!ticketId || !status || !priority) {
    return
  }

  if (!TICKET_STATUSES.has(status) || !TICKET_PRIORITIES.has(priority)) {
    return
  }

  const asesorId = asesorIdRaw && asesorIdRaw !== 'unassigned' ? asesorIdRaw : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('tickets')
    .update({
      asesor_id: asesorId,
      status,
      priority,
      closed_at: status === 'closed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  revalidateAdminSurface()
}

export async function updateConfigAction(formData: FormData) {
  const { user } = await requireAdmin()
  const supabase = await createClient()
  const key = formData.get('key')?.toString()
  const value = formData.get('value')?.toString()
  const description = formData.get('description')?.toString() ?? null

  if (!key || value === undefined) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('system_config')
    .update({
      value,
      description,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)

  revalidateAdminSurface()
}
