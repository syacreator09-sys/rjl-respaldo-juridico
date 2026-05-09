import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anthropic: !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('PENDIENTE'),
      stripe: !!process.env.STRIPE_SECRET_KEY,
      redis: !!process.env.UPSTASH_REDIS_REST_URL,
    },
  }

  const allReady = Object.values(checks.env).every(Boolean)

  return NextResponse.json(checks, {
    status: allReady ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
