"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/deinfluence";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600" />
        <p className="text-sm text-zinc-600">Redirecting to Reasoning Coach…</p>
      </div>
    </div>
  );
}
