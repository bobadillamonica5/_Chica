# Spanish Tutor — AI-Powered Grammar Practice

A conversational Spanish tutor that evaluates whether students correctly use the **preterite** vs **imperfect** past tense. Built with the Claude API, Next.js 15, and Supabase.

**Live demo:** https://chica-9pn4-bobadillamonica5s-projects.vercel.app

---

## What it does

Students type a Spanish sentence in the chat interface and receive structured AI feedback: whether their tense choice was correct, why, and a corrected version if not. When a student answers incorrectly, the tutor generates a multiple choice question targeting the same concept to reinforce learning before progressing.

For authenticated users, the app tracks performance history and uses it to personalize future feedback- spending more time on weak concepts and less on mastered ones.

---

## Features

- **AI grammar evaluation** — Claude analyzes each sentence and returns structured JSON with tense classification, verb analysis, trigger words, confidence score, and corrected sentence
- **Adaptive difficulty** — mastery scores are computed from a student's last 50 attempts and injected into the system prompt so Claude calibrates its feedback accordingly
- **Multiple choice reinforcement** — incorrect answers automatically generate a 4-option follow-up question with an explanation
- **Persistent session history** — authenticated users can log in via magic link (passwordless) and resume prior conversations
- **Focus Areas panel** — surfaces the student's top recurring error types from their full history
- **Anonymous guest mode** — works without an account; sessions are tracked per-browser

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Database | Supabase (PostgreSQL) — `evaluations` and `messages` tables |
| Auth | Supabase magic link (passwordless email) |
| Styling | Tailwind CSS 3 |
| Deployment | Vercel |

---

## Architecture

All AI calls happen server-side in `/app/api/evaluate/route.ts`. The route:

1. Resolves the student's identity (authenticated user ID or `anon:sessionId`)
2. Fetches the last 50 evaluation records from Supabase and computes a mastery summary
3. Injects mastery context + recent chat history into the Claude system prompt
4. Calls Claude and parses the structured JSON response
5. Overwrites server-controlled fields (`student_id`, `session_id`, `timestamp`) before persisting
6. Fire-and-forgets two Supabase writes: one to `evaluations`, one to `messages`

This ensures the client never controls identity or timestamps — only the sentence text.

---

## Running locally

```bash
# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Start dev server
npm run dev

# Type check
npx tsc --noEmit
```

---

## Grammar concepts covered

**Preterite:** completed actions, specific repetition, sequential narrative events, interrupting actions

**Imperfect:** habitual past actions, background descriptions, mental/emotional states, actions in progress

**Mixed:** combined interruption narratives (imperfect + preterite together)
