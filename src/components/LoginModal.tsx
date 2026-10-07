"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";

type TurnstileWidgetOptions = {
  sitekey: string;
  action: "admin_login";
  theme: "dark";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileWidgetOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function LoginModal({ onSuccess }: { onSuccess: () => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [widgetError, setWidgetError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || !window.turnstile) return;

    setWidgetError(false);
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: "admin_login",
      theme: "dark",
      callback: (challengeToken) => setToken(challengeToken),
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setWidgetError(true);
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !window.turnstile || !widgetIdRef.current) {
      setError("Complete the security check before signing in.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, turnstileToken: token }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Sign-in failed");
      onSuccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed");
    } finally {
      setToken("");
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
      setLoading(false);
    }
  };

  const verificationReady = Boolean(siteKey && scriptReady && token && !widgetError);

  return <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
    {siteKey ? <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onLoad={() => setScriptReady(true)}
      onError={() => setWidgetError(true)}
    /> : null}
    <section className="panel" style={{ width: "min(100%, 28rem)" }}>
      <span className="eyebrow">Protected workspace</span>
      <h1 style={{ fontSize: "2rem" }}>Administration sign-in</h1>
      <p className="supporting">Access to record management is restricted to authorised administrators.</p>
      <form className="confirmation" style={{ marginTop: "1.5rem" }} onSubmit={submit}>
        {error ? <p className="panel panel--danger" role="alert" style={{ margin: 0, padding: ".75rem" }}>{error}</p> : null}
        <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {siteKey ? <div ref={containerRef} aria-label="Security verification" /> : <p className="supporting" role="status">Security verification is not configured.</p>}
        {siteKey && !scriptReady && !widgetError ? <p className="supporting" role="status">Loading security verification…</p> : null}
        {widgetError ? <p className="panel panel--danger" role="alert" style={{ margin: 0, padding: ".75rem" }}>Security verification could not load. Refresh the page and try again.</p> : null}
        <button className="button" disabled={loading || !verificationReady}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </section>
  </div>;
}
