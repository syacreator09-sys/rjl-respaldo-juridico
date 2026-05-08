import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type { Database, SubStatus } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): SubStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    case 'past_due':
    case 'unpaid':
    case 'paused':
    case 'incomplete':
    default:
      return 'past_due'
  }
}

function toIsoOrNull(unixSeconds?: number | null): string | null {
  return typeof unixSeconds === 'number' ? new Date(unixSeconds * 1000).toISOString() : null
}

async function upsertSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  payload: Database['public']['Tables']['subscriptions']['Insert']
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('subscriptions').upsert(payload)
  if (error) {
    console.error('[stripe-webhook] subscription upsert failed:', error, 'payload user_id:', payload.user_id)
    throw new Error(`Subscription upsert failed: ${error.message}`)
  }
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? undefined
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id

      if (!userId || !subscriptionId || !customerId) {
        break
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await upsertSubscription(supabase, {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: normalizeSubscriptionStatus(subscription.status),
        price_id: subscription.items.data[0]?.price.id ?? process.env.STRIPE_PRICE_ID_MONTHLY ?? null,
        current_period_start: toIsoOrNull(subscription.current_period_start),
        current_period_end: toIsoOrNull(subscription.current_period_end),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id
      const status =
        event.type === 'customer.subscription.deleted'
          ? 'canceled'
          : normalizeSubscriptionStatus(subscription.status)

      if (userId) {
        await upsertSubscription(supabase, {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status,
          price_id: subscription.items.data[0]?.price.id ?? null,
          current_period_start: toIsoOrNull(subscription.current_period_start),
          current_period_end: toIsoOrNull(subscription.current_period_end),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
      } else {
        await (supabase as any)
          .from('subscriptions')
          .update({
            stripe_customer_id: customerId,
            status,
            price_id: subscription.items.data[0]?.price.id ?? null,
            current_period_start: toIsoOrNull(subscription.current_period_start),
            current_period_end: toIsoOrNull(subscription.current_period_end),
            cancel_at_period_end: subscription.cancel_at_period_end,
          } as Database['public']['Tables']['subscriptions']['Update'])
          .eq('stripe_subscription_id', subscription.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
