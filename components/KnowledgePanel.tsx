"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const ERROR_LABELS: Record<string, { label: string; description: string }> = {
  wrong_tense_completed_action: {
    label: "Imperfect for completed action",
    description: "Used imperfect when preterite is needed — e.g. a one-time event with a clear endpoint.",
  },
  wrong_tense_habitual_action: {
    label: "Preterite for habitual action",
    description: "Used preterite when imperfect is needed — e.g. something that happened repeatedly in the past.",
  },
  wrong_tense_background_description: {
    label: "Preterite for background description",
    description: "Used preterite when imperfect is needed to set the scene or describe a state.",
  },
  wrong_tense_mental_state: {
    label: "Preterite for mental/emotional state",
    description: "Used preterite for verbs like querer, saber, tener, or sentir that describe ongoing states.",
  },
  wrong_tense_interruption: {
    label: "Interruption pattern error",
    description: "Swapped preterite and imperfect in the interruption pattern — e.g. 'Dormía cuando sonó'.",
  },
  wrong_conjugation: {
    label: "Incorrect conjugation",
    description: "Right tense, wrong verb form — check person (yo/tú/él) or number (singular/plural).",
  },
  non_past_sentence: {
    label: "Not a past tense sentence",
    description: "Sentence wasn't in preterite or imperfect — make sure to use a past tense verb.",
  },
};

interface TopError {
  error_type: string;
  count: number;
}

export default function KnowledgePanel({ user }: { user: User | null }) {
  const [topErrors, setTopErrors] = useState<TopError[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setTopErrors(data.topErrors);
          setTotalMistakes(data.totalMistakes);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <p className="text-sm text-gray-500 mb-3">
          Log in to see your knowledge analysis.
        </p>
        <a
          href="/login"
          className="text-sm text-indigo-600 font-medium hover:underline"
        >
          Log in
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (topErrors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">
          No mistakes recorded yet — keep practicing!
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl w-full">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Focus Areas</h2>
      <p className="text-xs text-gray-400 mb-6">
        Your top patterns to work on, based on {totalMistakes} mistake{totalMistakes !== 1 ? "s" : ""} recorded.
      </p>
      <div className="flex flex-col gap-4">
        {topErrors.map(({ error_type, count }, i) => {
          const info = ERROR_LABELS[error_type] ?? {
            label: error_type.replace(/_/g, " "),
            description: "",
          };
          return (
            <div
              key={error_type}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex gap-5 items-start"
            >
              <span className="text-4xl font-bold text-indigo-100 leading-none select-none w-8 text-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {info.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-3 flex-shrink-0">
                    {count}×
                  </span>
                </div>
                <p className="text-xs text-gray-500">{info.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
