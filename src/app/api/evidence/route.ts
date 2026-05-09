import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { EvidenceUploadSchema } from '@/lib/validations/chat'

export const runtime = 'nodejs'

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
  const parsed = EvidenceUploadSchema.safeParse({
    caseId: fd.get('case_id'),
    category: fd.get('category'),
    gpsLat: fd.get('gps_lat') ? Number(fd.get('gps_lat')) : null,
    gpsLng: fd.get('gps_lng') ? Number(fd.get('gps_lng')) : null,
    gpsAccuracy: fd.get('gps_accuracy') ? Number(fd.get('gps_accuracy')) : null,
  })

  // device_time from client (optional, ISO string) — server_time via DB DEFAULT is authoritative
  const deviceTimeRaw = fd.get('device_time')
  const deviceTime = typeof deviceTimeRaw === 'string' && deviceTimeRaw ? deviceTimeRaw : null

  if (!file || !parsed.success) {
    return NextResponse.json(
      { error: 'Invalid evidence payload', details: parsed.success ? undefined : parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { caseId, category, gpsLat, gpsLng, gpsAccuracy } = parsed.data

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
    device_time: deviceTime,
  } as Database['public']['Tables']['evidence']['Insert'])

  if (dbError) {
    await supabase.storage.from('evidence').remove([filePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, filePath })
}
