// @package zod ^3.22.0
import { z } from 'zod';
import { DrillType, DrillResponse, DrillEvaluation, DrillEvaluationSchema } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Ensure proper error handling is configured for evaluation criteria validation
 * 2. Set up monitoring for evaluation metrics to track system performance
 * 3. Configure analytics to track feedback effectiveness and user improvement rates
 * 4. Implement proper validation for weight distributions in evaluation criteria
 */

// Re-export imported types
export type { DrillType, DrillResponse, DrillEvaluation };

// Requirement: AI Evaluation - Standardized evaluation criteria structure
export interface DrillEvaluationCriteria {
    drillType: DrillType;
    rubric: EvaluationRubric;
    weights: Record<string, number>; // Criteria weights must sum to 1.0
}

// Requirement: AI Evaluation - Detailed scoring rubric
export interface EvaluationRubric {
    criteria: string[];
    scoringGuide: Record<string, string>;
    maxScore: number;
}

// Requirement: Practice Drills - Comprehensive performance metrics
export interface DrillMetrics {
    timeSpent: number;      // In seconds
    completeness: number;   // 0-100 percentage
    accuracy: number;       // 0-100 percentage
    speed: number;         // 0-100 percentage relative to expected completion time
}

// Requirement: AI Evaluation - Structured AI-generated feedback
export interface DrillFeedback {
    strengths: string[];
    improvements: string[];
    detailedFeedback: Record<string, string>;
}

// Requirement: Practice Drills - Comprehensive result structure
export interface DrillResult {
    evaluation: DrillEvaluation;
    metrics: DrillMetrics;
    feedback: DrillFeedback;
}

// Requirement: AI Evaluation - Runtime validation schemas
export const EVALUATION_CRITERIA_SCHEMA = z.object({
    drillType: z.nativeEnum(DrillType),
    rubric: z.object({
        criteria: z.array(z.string()),
        scoringGuide: z.record(z.string()),
        maxScore: z.number().positive()
    }),
    weights: z.record(z.number().min(0).max(1))
}).refine(
    (data) => {
        const weightSum = Object.values(data.weights).reduce((sum, weight) => sum + weight, 0);
        return Math.abs(weightSum - 1.0) < 0.001; // Allow small floating point differences
    },
    { message: "Criteria weights must sum to 1.0" }
);

// Requirement: Practice Drills - Metrics validation
export const METRICS_SCHEMA = z.object({
    timeSpent: z.number().nonnegative(),
    completeness: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(100),
    speed: z.number().min(0).max(100)
});

// Type guards for runtime validation
export const isEvaluationCriteria = (value: unknown): value is DrillEvaluationCriteria => {
    return EVALUATION_CRITERIA_SCHEMA.safeParse(value).success;
};

export const isDrillMetrics = (value: unknown): value is DrillMetrics => {
    return METRICS_SCHEMA.safeParse(value).success;
};

export const isDrillFeedback = (value: unknown): value is DrillFeedback => {
    return z.object({
        strengths: z.array(z.string()),
        improvements: z.array(z.string()),
        detailedFeedback: z.record(z.string())
    }).safeParse(value).success;
};

export const isDrillResult = (value: unknown): value is DrillResult => {
    return z.object({
        evaluation: DrillEvaluationSchema,
        metrics: METRICS_SCHEMA,
        feedback: z.object({
            strengths: z.array(z.string()),
            improvements: z.array(z.string()),
            detailedFeedback: z.record(z.string())
        })
    }).safeParse(value).success;
};