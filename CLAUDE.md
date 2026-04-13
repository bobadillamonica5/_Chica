# Spanish Tutor — Claude Code Context

## What this app does
Next.js 15 + TypeScript chat app for practicing Spanish past tense. Users type a Spanish sentence; Claude (claude-sonnet-4-6) evaluates whether they used preterite vs imperfect correctly and returns structured JSON feedback.

## Tech stack
- **Framework**: Next.js 15 App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 3
- **AI**: @anthropic-ai/sdk — claude-sonnet-4-6, called from `/app/api/evaluate/route.ts`
- **Auth**: None (student_id hardcoded as "user_123")

## Key files
| File | Purpose |
|------|---------|
| `app/api/evaluate/route.ts` | POST handler — sends sentence to Claude, parses JSON, injects server-side fields |
| `app/page.tsx` | Main page — session/attempt tracking, fetch handler, message state |
| `components/ChatWindow.tsx` | Scrollable message list with loading indicator |
| `components/MessageBubble.tsx` | Individual message bubble (user right/indigo, assistant left/white) |
| `components/InputBar.tsx` | Textarea + submit, Enter to send, Shift+Enter for newline |
| `types/evaluation.ts` | **TypeScript source of truth** for all interfaces (EvaluationResponse, EnrichedMessage, etc.) |

## Response schema (`types/evaluation.ts`)
Claude returns structured JSON with three top-level keys:
- `tutor_response` — plain text shown in the chat bubble
- `metadata` — `is_correct`, `concept`, `difficulty_level` (1–5), `error_type`, `tense_used`, `tense_intended`, `trigger_words[]`, `verbs[]`, `corrected_sentence`, `confidence_score`
- `database_ready` — `student_id`, `session_id`, `attempt_number`, `original_sentence`, `verb_focus`, `concept_practiced`, `was_correct`, `error_type`, `difficulty_level`, `timestamp`

Server-controlled fields (`student_id`, `timestamp`, `session_id`, `attempt_number`) are injected in the route handler — never trusted from Claude.

## Grammar concepts covered
Preterite: completed_action, specific_repetition, sequential_events, interrupting_action  
Imperfect: habitual_action, background_description, mental_emotional_state, in_progress_action  
Mixed: combined_interruption_narrative

## Session tracking
`sessionId` (UUID) and `attemptCounter` are `useRef` values in `page.tsx`, created on mount and passed to the API with each request.

## Dev
```bash
npm run dev      # start dev server
npx tsc --noEmit # type check
```
