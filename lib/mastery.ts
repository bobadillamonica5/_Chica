import type { GrammarConcept } from "@/types/evaluation";

interface HistoryRow {
  concept_practiced: string;
  was_correct: boolean;
  difficulty_level: number;
}

export interface MasterySummary {
  totalAttempts: number;
  overallAccuracy: number;
  weakConcepts: GrammarConcept[];
  strongConcepts: GrammarConcept[];
  recentDifficulty: number;
}

export function computeMastery(rows: HistoryRow[]): MasterySummary {
  if (!rows.length) {
    return {
      totalAttempts: 0,
      overallAccuracy: 0,
      weakConcepts: [],
      strongConcepts: [],
      recentDifficulty: 2,
    };
  }

  const byConcept: Record<string, { correct: number; total: number }> = {};
  for (const row of rows) {
    const k = row.concept_practiced;
    if (!byConcept[k]) byConcept[k] = { correct: 0, total: 0 };
    byConcept[k].total++;
    if (row.was_correct) byConcept[k].correct++;
  }

  const weakConcepts: GrammarConcept[] = [];
  const strongConcepts: GrammarConcept[] = [];
  for (const [concept, s] of Object.entries(byConcept)) {
    if (s.total < 2) continue; // not enough data to judge
    const rate = s.correct / s.total;
    if (rate < 0.5) weakConcepts.push(concept as GrammarConcept);
    else if (rate >= 0.8) strongConcepts.push(concept as GrammarConcept);
  }

  // rows are fetched newest-first
  const recent = rows.slice(0, 5);
  const recentDifficulty = Math.round(
    recent.reduce((s, r) => s + r.difficulty_level, 0) / recent.length
  );

  return {
    totalAttempts: rows.length,
    overallAccuracy: Math.round(
      (rows.filter((r) => r.was_correct).length / rows.length) * 100
    ),
    weakConcepts,
    strongConcepts,
    recentDifficulty,
  };
}

export function masteryToPromptContext(m: MasterySummary): string {
  if (!m.totalAttempts) return "";

  const lines = [
    `## Student history (${m.totalAttempts} attempts, ${m.overallAccuracy}% accuracy)`,
  ];
  if (m.weakConcepts.length)
    lines.push(`Struggling with: ${m.weakConcepts.join(", ")}`);
  if (m.strongConcepts.length)
    lines.push(`Strong on: ${m.strongConcepts.join(", ")}`);
  lines.push(`Recent difficulty level: ${m.recentDifficulty}/5`);
  lines.push(
    "Use this context to personalize feedback. Give extra explanation for weak areas; keep feedback brief for strong ones."
  );

  return lines.join("\n");
}
