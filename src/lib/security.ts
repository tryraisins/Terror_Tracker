import { NextRequest, NextResponse } from "next/server";

// ─── In-memory rate limiter (per-instance; for production consider Redis) ───
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

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
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
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
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export function verifyAPIKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  return apiKey === process.env.API_KEY;
}

// ─── Combined middleware runner ───
export function applySecurityChecks(
  req: NextRequest,
  options: {
    rateLimit?: number;
    rateLimitWindow?: number;
    requireApiKey?: boolean;
    requireCronSecret?: boolean;
  } = {}
): NextResponse | null {
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
  const rl = rateLimit(ip, limit, window);

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
