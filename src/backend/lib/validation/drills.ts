// @package zod ^3.22.0
import { z } from 'zod';
import { 
  DrillType, 
  DrillDifficulty, 
  DrillStatus, 
  DrillPrompt, 
  DrillAttempt, 
  DrillEvaluation 
} from '../../types/drills';
import { 
  DrillEvaluationCriteria, 
  DrillMetrics 
} from '../drills/types';
import { validateDrillAttempt } from '../../utils/validation';

/**
 * Human Tasks:
 * 1. Configure monitoring for validation performance to ensure <100ms response time
 * 2. Set up error tracking for validation failures to identify common patterns
 * 3. Implement caching for frequently validated drill prompts
 * 4. Review and update validation rules quarterly based on user feedback
 */

// Requirement: Practice Drills - Core validation schema for drill prompts
export const DRILL_PROMPT_SCHEMA = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(DrillType),
  difficulty: z.nativeEnum(DrillDifficulty),
  content: z.string().min(1),
  timeLimit: z.number().min(60).max(3600), // 1-60 minutes
  industry: z.string()
});

// Requirement: User Engagement - Validation schema for drill attempts
export const DRILL_ATTEMPT_SCHEMA = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  drillId: z.string().uuid(),
  status: z.nativeEnum(DrillStatus),
  response: z.string(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
  timeSpent: z.number().min(0)
});

// Requirement: Practice Drills - Validation schema for drill evaluations
export const DRILL_EVALUATION_SCHEMA = z.object({
  attemptId: z.string().uuid(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  evaluatedAt: z.date()
});

// Requirement: Practice Drills - Validates drill prompt data
export async function validateDrillPrompt(drillPrompt: unknown): Promise<boolean> {
  try {
    const validatedPrompt = await DRILL_PROMPT_SCHEMA.parseAsync(drillPrompt);

    // Validate content length based on drill type
    const minContentLength: Record<DrillType, number> = {
      [DrillType.CASE_PROMPT]: 200,
      [DrillType.CALCULATION]: 50,
      [DrillType.CASE_MATH]: 100,
      [DrillType.BRAINSTORMING]: 150,
      [DrillType.MARKET_SIZING]: 100,
      [DrillType.SYNTHESIZING]: 200
    };

    if (validatedPrompt.content.length < minContentLength[validatedPrompt.type]) {
      throw new Error(`Content length must be at least ${minContentLength[validatedPrompt.type]} characters for ${validatedPrompt.type} drills`);
    }

    // Validate time limit based on difficulty
    const maxTimeLimit: Record<DrillDifficulty, number> = {
      [DrillDifficulty.BEGINNER]: 1800,     // 30 minutes
      [DrillDifficulty.INTERMEDIATE]: 2700,  // 45 minutes
      [DrillDifficulty.ADVANCED]: 3600      // 60 minutes
    };

    if (validatedPrompt.timeLimit > maxTimeLimit[validatedPrompt.difficulty]) {
      throw new Error(`Time limit cannot exceed ${maxTimeLimit[validatedPrompt.difficulty] / 60} minutes for ${validatedPrompt.difficulty} difficulty`);
    }

    return true;
  } catch (error) {
    throw new Error(`Drill prompt validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Requirement: Practice Drills - Validates user's drill response
export async function validateDrillResponse(drillResponse: unknown, drillType: DrillType): Promise<boolean> {
  try {
    const responseSchema = z.object({
      content: z.string().min(1),
      attachments: z.array(z.string().url()).optional(),
      calculations: z.array(z.number()).optional(),
      assumptions: z.array(z.string()).optional()
    });

    const validatedResponse = await responseSchema.parseAsync(drillResponse);

    // Type-specific validation rules
    switch (drillType) {
      case DrillType.CASE_PROMPT:
      case DrillType.SYNTHESIZING:
        if (validatedResponse.content.length < 300) {
          throw new Error('Response must be at least 300 characters for case prompts and synthesis');
        }
        break;
      case DrillType.CALCULATION:
      case DrillType.CASE_MATH:
        if (!validatedResponse.calculations || validatedResponse.calculations.length === 0) {
          throw new Error('Calculations are required for math-based drills');
        }
        break;
      case DrillType.MARKET_SIZING:
        if (!validatedResponse.assumptions || validatedResponse.assumptions.length < 3) {
          throw new Error('At least 3 assumptions are required for market sizing');
        }
        break;
      case DrillType.BRAINSTORMING:
        const ideas = validatedResponse.content.split('\n').filter(line => line.trim().length > 0);
        if (ideas.length < 5) {
          throw new Error('At least 5 distinct ideas are required for brainstorming');
        }
        break;
    }

    return true;
  } catch (error) {
    throw new Error(`Drill response validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Requirement: Practice Drills - Validates drill evaluation data
export async function validateDrillEvaluation(drillEvaluation: unknown): Promise<boolean> {
  try {
    const validatedEvaluation = await DRILL_EVALUATION_SCHEMA.parseAsync(drillEvaluation);

    // Validate feedback comprehensiveness
    if (validatedEvaluation.feedback.length < 50) {
      throw new Error('Evaluation feedback must be at least 50 characters');
    }

    // Validate strengths and improvements balance
    if (validatedEvaluation.strengths.length === 0 || validatedEvaluation.improvements.length === 0) {
      throw new Error('Both strengths and improvements must be provided');
    }

    if (validatedEvaluation.strengths.length + validatedEvaluation.improvements.length < 3) {
      throw new Error('At least 3 combined points of feedback (strengths + improvements) must be provided');
    }

    // Validate score distribution
    if (validatedEvaluation.score < 40 && validatedEvaluation.strengths.length > validatedEvaluation.improvements.length) {
      throw new Error('Low scores must have more improvement points than strengths');
    }

    if (validatedEvaluation.score > 80 && validatedEvaluation.improvements.length > validatedEvaluation.strengths.length) {
      throw new Error('High scores must have more strength points than improvements');
    }

    return true;
  } catch (error) {
    throw new Error(`Drill evaluation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}