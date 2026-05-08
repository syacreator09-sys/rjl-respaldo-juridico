import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY
  if (!priceId) {
    return NextResponse.json({ error: 'Missing STRIPE_PRICE_ID_MONTHLY' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/cliente?success=1`,
    cancel_url: `${req.nextUrl.origin}/pricing?canceled=1`,
  })

  return NextResponse.json({ url: session.url })
}
