// @package zod ^3.22.0
import { z } from 'zod';
import { User } from './user';

/**
 * Human Tasks:
 * 1. Ensure PostgreSQL database has appropriate enums created for DrillType, DrillDifficulty, and DrillStatus
 * 2. Configure analytics tracking for drill completion rates to monitor >80% completion target
 * 3. Set up proper indexing on drill attempts table for efficient user progress queries
 * 4. Implement proper date handling for timeSpent calculations across timezones
 */

// Requirement: Practice Drills - Core drill types
export enum DrillType {
    CASE_PROMPT = 'CASE_PROMPT',
    CALCULATION = 'CALCULATION',
    CASE_MATH = 'CASE_MATH',
    BRAINSTORMING = 'BRAINSTORMING',
    MARKET_SIZING = 'MARKET_SIZING',
    SYNTHESIZING = 'SYNTHESIZING'
}

// Requirement: Practice Drills - Progressive difficulty levels
export enum DrillDifficulty {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED'
}

// Requirement: User Engagement - Drill completion tracking
export enum DrillStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    EVALUATED = 'EVALUATED'
}

// Requirement: Practice Drills - Structured drill prompts
export interface DrillPrompt {
    id: string;
    type: DrillType;
    difficulty: DrillDifficulty;
    content: string;
    timeLimit: number; // in minutes
    industry: string;
}

// Requirement: User Engagement - Drill attempt tracking
export interface DrillAttempt {
    id: string;
    userId: User['id'];
    drillId: string;
    status: DrillStatus;
    response: string;
    startedAt: Date;
    completedAt: Date | null;
    timeSpent: number; // in seconds
}

// Requirement: Practice Drills - Comprehensive evaluation criteria
export interface DrillEvaluation {
    attemptId: string;
    score: number; // 0-100
    feedback: string;
    strengths: string[];
    improvements: string[];
    evaluatedAt: Date;
}

// Requirement: Practice Drills - Type-safe response handling
export interface DrillResponse<T> {
    success: boolean;
    data: T;
    error: string | null;
}

// Zod schemas for runtime validation

export const DrillPromptSchema = z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(DrillType),
    difficulty: z.nativeEnum(DrillDifficulty),
    content: z.string().min(1),
    timeLimit: z.number().int().positive(),
    industry: z.string().min(1)
});

export const DrillAttemptSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    drillId: z.string().uuid(),
    status: z.nativeEnum(DrillStatus),
    response: z.string(),
    startedAt: z.date(),
    completedAt: z.date().nullable(),
    timeSpent: z.number().int().min(0)
});

export const DrillEvaluationSchema = z.object({
    attemptId: z.string().uuid(),
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    evaluatedAt: z.date()
});

export const DrillResponseSchema = <T extends z.ZodType>(dataSchema: T) => 
    z.object({
        success: z.boolean(),
        data: dataSchema,
        error: z.string().nullable()
    });

// Type guards for runtime type checking
export const isDrillPrompt = (value: unknown): value is DrillPrompt => {
    return DrillPromptSchema.safeParse(value).success;
};

export const isDrillAttempt = (value: unknown): value is DrillAttempt => {
    return DrillAttemptSchema.safeParse(value).success;
};

export const isDrillEvaluation = (value: unknown): value is DrillEvaluation => {
    return DrillEvaluationSchema.safeParse(value).success;
};

export const isDrillResponse = <T extends z.ZodType>(
    value: unknown,
    dataSchema: T
): value is DrillResponse<z.infer<T>> => {
    return DrillResponseSchema(dataSchema).safeParse(value).success;
};