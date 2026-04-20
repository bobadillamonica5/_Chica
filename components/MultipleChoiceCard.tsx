"use client";

import { useState } from "react";
import type { MultipleChoiceQuestion } from "@/types/evaluation";

export default function MultipleChoiceCard({
  mcq,
}: {
  mcq: MultipleChoiceQuestion;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const isCorrect = selected === mcq.correct_index;

  function optionStyle(i: number) {
    if (!answered) {
      return "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
    }
    if (i === mcq.correct_index) {
      return "border-green-400 bg-green-50 text-green-800";
    }
    if (i === selected) {
      return "border-red-300 bg-red-50 text-red-700";
    }
    return "border-gray-100 text-gray-400";
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-2xl bg-gray-50 px-4 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Quick check
      </p>
      <p className="text-sm text-gray-800 mb-3">{mcq.question}</p>
      <div className="flex flex-col gap-2">
        {mcq.options.map((option, i) => (
          <button
            key={i}
            disabled={answered}
            onClick={() => setSelected(i)}
            className={`text-left text-sm px-4 py-2.5 rounded-xl border transition-colors ${optionStyle(i)}`}
          >
            <span className="font-medium mr-2 text-gray-400">
              {String.fromCharCode(65 + i)}.
            </span>
            {option}
          </button>
        ))}
      </div>
      {answered && (
        <div
          className={`mt-3 text-xs rounded-xl px-3 py-2 ${
            isCorrect
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isCorrect ? "✓ Correct! " : "Not quite. "}
          {mcq.explanation}
        </div>
      )}
    </div>
  );
}
