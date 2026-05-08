import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'

const ALLOWED_CATEGORIES = new Set([
  'entrada_trabajo',
  'salida_trabajo',
  'contrato',
  'recibo_pago',
  'gastos_medicos',
  'cambio_domicilio',
  'otro',
])

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fd = await req.formData()
  const file = fd.get('file') as File | null
  const category = fd.get('category') as string | null
  const caseId = fd.get('case_id') as string | null
  const gpsLat = fd.get('gps_lat') ? parseFloat(fd.get('gps_lat') as string) : null
  const gpsLng = fd.get('gps_lng') ? parseFloat(fd.get('gps_lng') as string) : null
  const gpsAccuracy = fd.get('gps_accuracy') ? parseFloat(fd.get('gps_accuracy') as string) : null

  if (!file || !category || !caseId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const { data: ownedCase } = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('client_id', user.id)
    .single() as unknown as { data: Database['public']['Tables']['cases']['Row'] | null }

  if (!ownedCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const safeFileName = sanitizeFileName(file.name)
  const filePath = `${user.id}/${caseId}/${Date.now()}-${safeFileName}`
  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(filePath, file, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: dbError } = await (supabase as any).from('evidence').insert({
    case_id: caseId,
    category,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    gps_lat: gpsLat,
    gps_lng: gpsLng,
    gps_accuracy: gpsAccuracy,
    device_time: new Date().toISOString(),
  } as Database['public']['Tables']['evidence']['Insert'])

  if (dbError) {
    await supabase.storage.from('evidence').remove([filePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, filePath })
}
