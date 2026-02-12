import { NextRequest, NextResponse } from "next/server";

// Global middleware for security headers on all routes
export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // Security headers (Helmet equivalent)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // CORS for API routes
  if (req.nextUrl.pathname.startsWith("/api")) {
    const origin = req.headers.get("origin") || "";
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ];

    if (allowedOrigins.includes(origin) || origin === "") {
      response.headers.set("Access-Control-Allow-Origin", origin || allowedOrigins[0]);
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key, X-Cron-Secret"
    );

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  // Enforce file upload limits by rejecting oversized payloads early
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 1_048_576) {
    // 1MB max
    return NextResponse.json(
      { error: "Request payload too large" },
      { status: 413 }
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
