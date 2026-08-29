"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 5 * 60 * 1000; // check every 5 minutes

export default function UpdateNotifier() {
  const initialBuildId = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = await res.json();

        if (initialBuildId.current === null) {
          initialBuildId.current = buildId;
        } else if (buildId !== initialBuildId.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // silently ignore network errors
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md flex items-center gap-3 bg-amber-400 text-black px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium">
      <span className="flex-1">A new version is available.</span>
      <button
        onClick={() => window.location.reload()}
        className="bg-black text-amber-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
      >
        Update now
      </button>
      <button
        onClick={() => setUpdateAvailable(false)}
        className="text-black/60 hover:text-black transition-colors text-xs"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
