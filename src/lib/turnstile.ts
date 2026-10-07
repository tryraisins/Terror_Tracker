const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "admin_login";

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

export type TurnstileResult = "valid" | "invalid" | "unavailable" | "misconfigured";

export async function verifyAdminLoginChallenge(token: unknown): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const allowedHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);

  if (!secret || allowedHostnames.length === 0) return "misconfigured";
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return "invalid";
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return "unavailable";

    const result = (await response.json()) as SiteverifyResponse;
    const hostname = result.hostname?.trim().toLowerCase().replace(/\.$/, "");
    if (!result.success) return "invalid";
    if (result.action !== TURNSTILE_ACTION || !hostname || !allowedHostnames.includes(hostname)) {
      return "invalid";
    }
    return "valid";
  } catch {
    return "unavailable";
  }
}
