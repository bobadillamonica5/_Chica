export type Tense = "preterite" | "imperfect" | "both" | "neither" | "unknown";

export type GrammarConcept =
  | "preterite_completed_action"
  | "preterite_specific_repetition"
  | "preterite_sequential_events"
  | "preterite_interrupting_action"
  | "imperfect_habitual_action"
  | "imperfect_background_description"
  | "imperfect_mental_emotional_state"
  | "imperfect_in_progress_action"
  | "combined_interruption_narrative"
  | "unknown";

export type ErrorType =
  | "wrong_tense_completed_action"
  | "wrong_tense_habitual_action"
  | "wrong_tense_background_description"
  | "wrong_tense_mental_state"
  | "wrong_tense_interruption"
  | "wrong_conjugation"
  | "non_past_sentence"
  | "none";

// 1 = single completed action with explicit time word
// 5 = no time marker, meaning-dependent
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface VerbDetail {
  verb_infinitive: string;
  conjugated_form: string;
  tense_used: Tense;
  tense_intended: Tense;
  is_state_verb: boolean;
}

export interface TriggerWord {
  word: string;
  implies_tense: Tense;
}

export interface TutorMetadata {
  is_correct: boolean;
  concept: GrammarConcept;
  difficulty_level: DifficultyLevel;
  error_type: ErrorType;
  tense_used: Tense;
  tense_intended: Tense;
  trigger_words: TriggerWord[];
  verbs: VerbDetail[];
  corrected_sentence: string | null;
  confidence_score: number;
}

export interface DatabaseRecord {
  student_id: string;
  session_id: string;
  attempt_number: number;
  original_sentence: string;
  verb_focus: string | null;
  concept_practiced: GrammarConcept;
  was_correct: boolean;
  error_type: ErrorType;
  difficulty_level: DifficultyLevel;
  tense_used: Tense;
  tense_intended: Tense;
  confidence_score: number;
  timestamp: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  options: string[];      // exactly 4
  correct_index: number;  // 0-based
  explanation: string;
}

export interface EvaluationResponse {
  tutor_response: string;
  metadata: TutorMetadata;
  database_ready: DatabaseRecord;
  multiple_choice: MultipleChoiceQuestion | null;  // null when is_correct is true
}

export interface EnrichedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  evaluation?: EvaluationResponse;
}
