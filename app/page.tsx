"use client";

import { useEffect, useRef, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputBar from "@/components/InputBar";
import type { EnrichedMessage } from "@/types/evaluation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Message = EnrichedMessage;

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola! I'm your Spanish tutor. Type a sentence about the past in Spanish and I'll evaluate whether you used the preterite or imperfect tense correctly.\n\nTry something like:\n• \"Ayer comí pizza.\" (Did I use the right tense?)\n• \"Cuando era niño, jugaba al fútbol todos los días.\"\n• \"Dormía cuando sonó el teléfono.\"",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const sessionId = useRef<string>(crypto.randomUUID());
  const attemptCounter = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  async function handleSubmit(sentence: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: sentence,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    attemptCounter.current += 1;

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence,
          sessionId: sessionId.current,
          attemptNumber: attemptCounter.current,
        }),
      });

      const data = await res.json();

      if ("error" in data) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: data.error },
        ]);
      } else {
        const ev = data.evaluation;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: ev.tutor_response,
            evaluation: ev,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Error connecting to the server. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Spanish Tutor</h1>
          <p className="text-xs text-gray-500 mt-0.5">Preterite vs Imperfect</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-gray-500">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-indigo-600 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <a href="/login" className="text-xs text-indigo-600 hover:underline">
              Log in to save history
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl w-full mx-auto">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </div>

      <div className="max-w-3xl w-full mx-auto w-full">
        <InputBar onSubmit={handleSubmit} disabled={isLoading} />
      </div>
    </main>
  );
}
