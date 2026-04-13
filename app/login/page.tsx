"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-gray-600">
            We sent a magic link to <strong>{email}</strong>. Click it to log
            in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          Log in to Spanish Tutor
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          Enter your email — we&apos;ll send a magic link. No password needed.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          <a href="/" className="underline">
            Continue as guest
          </a>
        </p>
      </div>
    </main>
  );
}
