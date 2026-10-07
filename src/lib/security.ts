import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

// ─── In-memory rate limiter (fallback when Redis is not configured) ───
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const upstashLimiters = new Map<string, Ratelimit>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getClientIP(req: NextRequest): string {
  // Netlify sets the real client address on this platform-controlled header.
  // Never trust the first x-forwarded-for hop: it is client-controllable and
  // would let a caller rotate the rate-limit key to bypass every limit.
  const netlifyIp = req.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    // The nearest trusted proxy appends the true client address last.
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  const cached = upstashLimiters.get(key);
  if (cached) return cached;

  const windowSeconds = Math.ceil(windowMs / 1000);
  const limiter = new Ratelimit({
    redis: redis!,
    // Namespace each (limit, window) pair so distinct endpoints do not share
    // one counter and lock each other out.
    prefix: `rl:${limit}:${windowSeconds}`,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
  });
  upstashLimiters.set(key, limiter);
  return limiter;
}

export async function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  if (redis) {
    const limiter = getUpstashLimiter(limit, windowMs);
    try {
      const result = await limiter.limit(key);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetIn: Math.max(0, result.reset - Date.now()),
      };
    } catch (error) {
      console.warn("Upstash rate limit failed, falling back to in-memory.", error);
    }
  }

  const now = Date.now();
  // Include limit and window in the fallback key so each endpoint bucket is
  // isolated, matching the Redis path's per-limiter namespacing.
  const bucketKey = `${limit}:${windowMs}:${key}`;
  const entry = rateLimitMap.get(bucketKey);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(bucketKey, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// ─── IP Block List ───
const BLOCKED_IPS: Set<string> = new Set([
  // Add IPs to block here
  // "1.2.3.4",
]);

export function isBlockedIP(ip: string): boolean {
  return BLOCKED_IPS.has(ip);
}

export function blockIP(ip: string): void {
  BLOCKED_IPS.add(ip);
}

// ─── CORS Headers ───
export function setCORSHeaders(response: NextResponse): NextResponse {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ];

  response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Cron-Secret"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

// ─── Auth verification ───
export function verifyCronSecret(req: NextRequest): boolean {
  return secretsMatch(req.headers.get("x-cron-secret"), process.env.CRON_SECRET);
}

export function verifyAPIKey(req: NextRequest): boolean {
  return secretsMatch(req.headers.get("x-api-key"), process.env.API_KEY);
}

// ─── Combined middleware runner ───
export async function applySecurityChecks(
  req: NextRequest,
  options: {
    rateLimit?: number;
    rateLimitWindow?: number;
    requireApiKey?: boolean;
    requireCronSecret?: boolean;
  } = {}
): Promise<NextResponse | null> {
  const ip = getClientIP(req);

  // Check IP blocklist
  if (isBlockedIP(ip)) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  // Rate limiting
  const limit = options.rateLimit ?? 60;
  const window = options.rateLimitWindow ?? 60_000;
  const rl = await rateLimit(ip, limit, window);

  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(Math.ceil(rl.resetIn / 1000)));
    return setCORSHeaders(res);
  }

  // Auth checks
  if (options.requireCronSecret && !verifyCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (options.requireApiKey && !verifyAPIKey(req)) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  return null; // All checks passed
}

// --- CSRF protection for cookie-based auth ---
export function verifyCsrf(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ];

  if (origin && allowedOrigins.includes(origin)) return true;
  if (referer && allowedOrigins.some((o) => referer.startsWith(o))) return true;

  return false;
}
