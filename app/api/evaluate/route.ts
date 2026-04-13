import Anthropic from "@anthropic-ai/sdk";
import type { EvaluationResponse } from "@/types/evaluation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { computeMastery, masteryToPromptContext } from "@/lib/mastery";

const anthropic = new Anthropic();

const BASE_SYSTEM_PROMPT = `You are a Spanish grammar tutor specializing in past tense usage.

The user will submit a Spanish sentence that uses a past tense verb. Your job is to evaluate whether they correctly used the PRETERITE (pretérito indefinido) or the IMPERFECT (pretérito imperfecto).

## Rules to apply

**Use PRETERITE for:**
- Completed actions with a defined endpoint ("Ayer comí una pizza")
- Actions that happened a specific number of times ("Fui tres veces")
- Sequential narrative events ("Llegué, vi, vencí")
- Actions that interrupted an ongoing state

**Use IMPERFECT for:**
- Ongoing or habitual past actions ("Cuando era niño, jugaba al fútbol")
- Background descriptions and setting the scene ("Llovía y hacía frío")
- Emotional or mental states in the past ("Tenía miedo")
- Actions in progress when something else happened ("Dormía cuando sonó el teléfono")

If the sentence contains BOTH tenses (e.g., imperfect + preterite together), evaluate whether the combination is correct for the intended meaning.

If the input is not a Spanish past tense sentence, politely ask the user to submit a Spanish sentence using preterite or imperfect.

Keep your tone encouraging and educational. Aim for 3–5 sentences total.

## Response format — CRITICAL

Respond with ONLY a single valid JSON object. No markdown code fences, no prose before or after the JSON.
Required top-level keys: tutor_response, metadata, database_ready.

tutor_response: (string) Your 3–5 sentence feedback following all rules above. Start with "✓ Correct!" for correct sentences or "✗ Not quite." for incorrect ones. For correct sentences: state the tense used, explain why it is right in 2–3 sentences, give a similar example. For incorrect sentences: identify the verb(s), explain the error, state the correct tense and why, provide the corrected sentence.

metadata:
  is_correct: boolean
  concept: one of ["preterite_completed_action","preterite_specific_repetition","preterite_sequential_events","preterite_interrupting_action","imperfect_habitual_action","imperfect_background_description","imperfect_mental_emotional_state","imperfect_in_progress_action","combined_interruption_narrative","unknown"]
  difficulty_level: integer 1–5 (1=single action with explicit time word, 5=no time marker meaning-dependent)
  error_type: one of ["wrong_tense_completed_action","wrong_tense_habitual_action","wrong_tense_background_description","wrong_tense_mental_state","wrong_tense_interruption","wrong_conjugation","non_past_sentence","none"] (use "none" when is_correct is true)
  tense_used: one of ["preterite","imperfect","both","neither","unknown"]
  tense_intended: one of ["preterite","imperfect","both","neither","unknown"]
  trigger_words: array of { "word": string, "implies_tense": string } (empty array if none found)
  verbs: array of { "verb_infinitive": string, "conjugated_form": string, "tense_used": string, "tense_intended": string, "is_state_verb": boolean }
  corrected_sentence: string or null (null when is_correct is true)
  confidence_score: float 0.0–1.0

database_ready:
  student_id: "[injected server-side]"
  session_id: use the SESSION_ID value from the user message
  attempt_number: use the ATTEMPT_NUMBER value from the user message (as integer)
  original_sentence: the exact SENTENCE value from the user message
  verb_focus: infinitive of the primary verb being evaluated, or null
  concept_practiced: same as metadata.concept
  was_correct: same as metadata.is_correct
  error_type: same as metadata.error_type
  difficulty_level: same as metadata.difficulty_level
  tense_used: same as metadata.tense_used
  tense_intended: same as metadata.tense_intended
  confidence_score: same as metadata.confidence_score
  timestamp: ""`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sentence: string = body?.sentence?.trim();
  const sessionId: string = body?.sessionId ?? crypto.randomUUID();
  const attemptNumber: number = body?.attemptNumber ?? 1;

  if (!sentence) {
    return Response.json({ error: "No sentence provided" }, { status: 400 });
  }

  if (sentence.length > 500) {
    return Response.json({ error: "Sentence too long" }, { status: 400 });
  }

  // Resolve student identity server-side — never trust the client for this
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const studentId = user ? user.id : `anon:${sessionId}`;

  // For authenticated users, fetch history and build a mastery context prefix
  let masteryContext = "";
  if (user) {
    const serviceClient = createServiceClient();
    const { data: history } = await serviceClient
      .from("evaluations")
      .select("concept_practiced, was_correct, difficulty_level")
      .eq("student_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (history && history.length > 0) {
      masteryContext = masteryToPromptContext(computeMastery(history));
    }
  }

  const systemPrompt = masteryContext
    ? `${masteryContext}\n\n${BASE_SYSTEM_PROMPT}`
    : BASE_SYSTEM_PROMPT;

  const userContent = `SESSION_ID: ${sessionId}\nATTEMPT_NUMBER: ${attemptNumber}\nSENTENCE: ${sentence}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: EvaluationResponse;
  try {
    const cleaned = (rawText.match(/\{[\s\S]*\}/) ?? [])[0] ?? rawText;
    parsed = JSON.parse(cleaned);
  } catch {
    return Response.json(
      { error: "Claude returned malformed JSON." },
      { status: 500 }
    );
  }

  // Inject all server-controlled fields
  parsed.database_ready.student_id = studentId;
  parsed.database_ready.timestamp = new Date().toISOString();
  parsed.database_ready.session_id = sessionId;
  parsed.database_ready.attempt_number = attemptNumber;
  parsed.database_ready.tense_used = parsed.metadata.tense_used;
  parsed.database_ready.tense_intended = parsed.metadata.tense_intended;
  parsed.database_ready.confidence_score = parsed.metadata.confidence_score;

  // Fire-and-forget DB write — does not block the response
  const serviceClient = createServiceClient();
  serviceClient
    .from("evaluations")
    .insert(parsed.database_ready)
    .then(({ error }) => {
      if (error) {
        console.error("[DB write failed]", error.message, {
          student_id: studentId,
          session_id: sessionId,
          attempt_number: attemptNumber,
        });
      }
    });

  return Response.json({ evaluation: parsed });
}
