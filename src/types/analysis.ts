import { z } from 'zod';

/**
 * Shared contract between the serverless AI endpoint and the React client.
 * The server validates every model response against this schema before
 * returning it, so the UI never has to render half-formed AI output.
 */

export const DIFFICULTIES = ['Easy', 'Medium', 'Advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ACTION_TYPES = [
  'reduce',
  'keep-using',
  'repair',
  'reuse',
  'donate',
  'recycle',
  'specialized-disposal',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const SAFETY_LEVELS = ['standard', 'caution', 'hazardous'] as const;
export type SafetyLevel = (typeof SAFETY_LEVELS)[number];

const shortString = z.string().trim().min(1).max(400);
const paragraph = z.string().trim().min(1).max(1200);

export const reuseIdeaSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: shortString,
  description: paragraph,
  difficulty: z.enum(DIFFICULTIES),
  estimatedTime: shortString,
  materialsNeeded: z.array(shortString).max(12).default([]),
  instructions: z.array(paragraph).min(2).max(12),
  safetyNotes: z.array(shortString).max(8).default([]),
  environmentalBenefit: paragraph,
});

export const wasteAnalysisSchema = z.object({
  itemName: shortString,
  description: paragraph,
  materials: z.array(shortString).min(1).max(8),
  category: shortString,
  identificationNotes: z.array(shortString).max(8).default([]),
  possibleActions: z.array(z.enum(ACTION_TYPES)).min(1).max(7),
  safetyLevel: z.enum(SAFETY_LEVELS),
  hazardWarnings: z.array(shortString).max(8).default([]),
  advantages: z.array(shortString).min(3).max(5),
  disadvantages: z.array(shortString).min(3).max(5),
  environmentalImpact: z.object({
    improperDisposal: paragraph,
    landfill: paragraph,
    recycling: paragraph,
    reuse: paragraph,
    wildlifeRisks: z.array(shortString).max(8).default([]),
  }),
  recommendedAction: z.object({
    type: z.enum(ACTION_TYPES),
    explanation: paragraph,
    precautions: z.array(shortString).max(8).default([]),
  }),
  recyclingGuidance: z.object({
    generalSteps: z.array(shortString).min(1).max(10),
    localRulesWarning: paragraph,
  }),
  reuseIdeas: z.array(reuseIdeaSchema).max(3).default([]),
  reuseIdeasNotice: z.string().trim().max(600).nullable().default(null),
  uncertaintyNotice: z.string().trim().max(600).nullable().default(null),
});

export type ReuseIdea = z.infer<typeof reuseIdeaSchema>;
export type WasteAnalysis = z.infer<typeof wasteAnalysisSchema>;

export interface AnalyzeMeta {
  /** Provider that produced the written analysis (stage 2). */
  provider: 'groq' | 'nvidia';
  model: string;
  /** Provider that identified the photograph (stage 1), when an image was sent. */
  visionProvider?: 'groq' | 'nvidia';
  visionModel?: string;
  inputMode: 'text' | 'image' | 'text+image';
  elapsedMs: number;
  attempts: number;
}

export interface AnalyzeSuccess {
  ok: true;
  analysis: WasteAnalysis;
  meta: AnalyzeMeta;
}

export interface AnalyzeFailure {
  ok: false;
  error: {
    code:
      | 'bad_request'
      | 'payload_too_large'
      | 'unsupported_media'
      | 'not_configured'
      | 'rate_limited'
      | 'upstream_error'
      | 'invalid_model_output'
      | 'timeout'
      | 'method_not_allowed'
      | 'internal_error';
    message: string;
    retryable: boolean;
  };
}

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeFailure;

export const ACTION_LABELS: Record<ActionType, string> = {
  reduce: 'Reduce consumption',
  'keep-using': 'Keep using it',
  repair: 'Repair',
  reuse: 'Reuse',
  donate: 'Donate',
  recycle: 'Recycle',
  'specialized-disposal': 'Specialized disposal',
};
