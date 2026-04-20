"use client";

import { useEffect, useRef, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputBar from "@/components/InputBar";
import KnowledgePanel from "@/components/KnowledgePanel";
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

const NAV_ITEMS = [
  { id: "chat", label: "Chat" },
  { id: "focus", label: "Focus Areas" },
] as const;

type View = "chat" | "focus";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("chat");
  const sessionId = useRef<string>(crypto.randomUUID());
  const attemptCounter = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadHistory();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadHistory() {
    const res = await fetch("/api/messages");
    if (!res.ok) return;
    const data = await res.json();
    if (!data.messages?.length) return;
    const loaded: Message[] = data.messages.map(
      (m: { role: "user" | "assistant"; content: string }) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
      })
    );
    setMessages(loaded);
  }

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

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <nav className="w-44 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-4 gap-1 px-2">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === "chat" ? (
            <>
              <ChatWindow messages={messages} isLoading={isLoading} />
              <InputBar onSubmit={handleSubmit} disabled={isLoading} />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <KnowledgePanel user={user} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
