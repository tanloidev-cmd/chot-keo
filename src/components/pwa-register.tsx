"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA is an enhancement; ignore registration failures.
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
