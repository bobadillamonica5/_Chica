import type { EnrichedMessage } from "@/types/evaluation";
import MultipleChoiceCard from "@/components/MultipleChoiceCard";

export type Message = EnrichedMessage;

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const mcq = message.evaluation?.multiple_choice ?? null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
          }`}
        >
          {message.content}
        </div>
        {!isUser && mcq && <MultipleChoiceCard mcq={mcq} />}
      </div>
    </div>
  );
}
