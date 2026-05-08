// Rate limiting for public chat (3 free messages per IP per day)
// Uses Upstash Redis if configured, falls back to in-memory Map

type RateLimitResult = { allowed: boolean; remaining: number; reset: number }

// Alias for chat/route.ts — returns Upstash-compatible { success } shape
export async function rateLimit(identifier: string, limit = 3): Promise<{ success: boolean }> {
  const result = await checkRateLimit(identifier, limit)
  return { success: result.allowed }
}

// In-memory fallback (resets on server restart)
const inMemory = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(
  identifier: string,
  limit = 3,
  windowMs = 24 * 60 * 60 * 1000 // 24 hours
): Promise<RateLimitResult> {
  const now = Date.now()

  // Try Upstash Redis first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')
      const ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, '24 h'),
        analytics: false,
        prefix: 'rjl:ratelimit',
      })
      const { success, remaining, reset } = await ratelimit.limit(identifier)
      return { allowed: success, remaining, reset }
    } catch {}
  }

  // Fallback: in-memory
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  const record = inMemory.get(key) ?? { count: 0, resetAt: now + windowMs }
  record.count++
  inMemory.set(key, record)

  // Cleanup old entries
  if (inMemory.size > 10000) {
    for (const [k, v] of inMemory) {
      if (v.resetAt < now) inMemory.delete(k)
    }
  }

  return {
    allowed: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.resetAt,
  }
}
