// @package zod ^3.22.0
import { z } from 'zod';

import { 
  DrillType, 
  DrillResponse, 
  DrillEvaluation, 
  DrillEvaluationCriteria, 
  DrillResult, 
  DrillMetrics 
} from './types';

import { 
  CalculationEvaluator,
  validateCalculation,
  calculateMetrics 
} from './calculator';

import { 
  evaluateDrillAttempt,
  calculateDrillMetrics 
} from './evaluator';

/**
 * Human Tasks:
 * 1. Monitor evaluation performance metrics to ensure <200ms response time
 * 2. Set up error tracking for evaluation failures
 * 3. Configure analytics for drill completion rates
 * 4. Review and adjust timeout settings based on performance data
 */

// Requirement: System Performance - Global configuration
const DEFAULT_EVALUATION_CONFIG = {
  timeout: 30000,    // 30 second timeout
  maxRetries: 3,     // Maximum retry attempts
  maxResponseLength: 8000  // Maximum response length
};

/**
 * Requirement: Practice Drills - Factory class for drill evaluator instantiation
 */
export class DrillEvaluatorFactory {
  private static instance: DrillEvaluatorFactory;
  private evaluators: Map<DrillType, Function>;

  private constructor() {
    this.evaluators = new Map();
    
    // Register specialized evaluators with config
    const calculatorConfig = {
      tolerance: 0.01,
      benchmarks: {
        targetTime: 180,
        targetAccuracy: 95
      }
    };
    
    this.evaluators.set(DrillType.CALCULATION, new CalculationEvaluator(calculatorConfig).evaluate);
    this.evaluators.set(DrillType.CASE_MATH, new CalculationEvaluator(calculatorConfig).evaluate);
    
    // Default evaluator for other drill types
    this.evaluators.set(DrillType.CASE_PROMPT, evaluateDrillAttempt);
    this.evaluators.set(DrillType.BRAINSTORMING, evaluateDrillAttempt);
    this.evaluators.set(DrillType.MARKET_SIZING, evaluateDrillAttempt);
    this.evaluators.set(DrillType.SYNTHESIZING, evaluateDrillAttempt);
  }

  public static getInstance(): DrillEvaluatorFactory {
    if (!DrillEvaluatorFactory.instance) {
      DrillEvaluatorFactory.instance = new DrillEvaluatorFactory();
    }
    return DrillEvaluatorFactory.instance;
  }

  public getEvaluator(drillType: DrillType): Function {
    const evaluator = this.evaluators.get(drillType);
    if (!evaluator) {
      return evaluateDrillAttempt; // Default evaluator
    }
    return evaluator;
  }
}

/**
 * Requirement: Practice Drills - Main evaluation function with comprehensive error handling
 */
export async function evaluateDrill(
  drillType: DrillType,
  prompt: string,
  response: string,
  criteria: DrillEvaluationCriteria
): Promise<DrillResult> {
  // Validate input parameters
  const inputSchema = z.object({
    drillType: z.nativeEnum(DrillType),
    prompt: z.string().min(1),
    response: z.string().min(1).max(DEFAULT_EVALUATION_CONFIG.maxResponseLength),
    criteria: z.object({
      drillType: z.nativeEnum(DrillType),
      rubric: z.object({
        criteria: z.array(z.string()),
        scoringGuide: z.record(z.string()),
        maxScore: z.number().positive()
      }),
      weights: z.record(z.number().min(0).max(1))
    })
  });

  const validationResult = inputSchema.safeParse({ drillType, prompt, response, criteria });
  if (!validationResult.success) {
    throw new Error(`Invalid input parameters: ${validationResult.error.message}`);
  }

  try {
    // Get appropriate evaluator
    const evaluator = DrillEvaluatorFactory.getInstance().getEvaluator(drillType);
    
    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_EVALUATION_CONFIG.timeout);

    // Execute evaluation with timeout
    const evaluation = await Promise.race([
      evaluator(drillType, prompt, response, criteria),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), DEFAULT_EVALUATION_CONFIG.timeout)
      )
    ]);

    clearTimeout(timeoutId);

    // Calculate metrics
    const metrics = await getDrillMetrics(drillType, response, evaluation.timeSpent);

    // Construct final result
    return {
      evaluation,
      metrics,
      feedback: {
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        detailedFeedback: evaluation.feedback
      }
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Evaluation timed out after ${DEFAULT_EVALUATION_CONFIG.timeout}ms`);
    }
    throw error;
  }
}

/**
 * Requirement: Practice Drills - Metrics calculation with standardized scoring
 */
export async function getDrillMetrics(
  drillType: DrillType,
  response: string,
  timeSpent: number
): Promise<DrillMetrics> {
  // Validate input parameters
  const metricsInputSchema = z.object({
    drillType: z.nativeEnum(DrillType),
    response: z.string().min(1),
    timeSpent: z.number().min(0)
  });

  const validationResult = metricsInputSchema.safeParse({ drillType, response, timeSpent });
  if (!validationResult.success) {
    throw new Error(`Invalid metrics parameters: ${validationResult.error.message}`);
  }

  // Calculate base metrics
  const baseMetrics = calculateDrillMetrics(response, timeSpent, drillType);

  // Apply drill-specific metric calculations
  if (drillType === DrillType.CALCULATION || drillType === DrillType.CASE_MATH) {
    const calculationMetrics = await calculateMetrics(timeSpent, 95, {
      targetTime: 180,  // 3 minutes target for calculations
      targetAccuracy: 95
    });
    
    // Blend calculation-specific metrics with base metrics
    return {
      timeSpent: baseMetrics.timeSpent,
      completeness: calculationMetrics.accuracyScore,
      accuracy: calculationMetrics.accuracyScore,
      speed: calculationMetrics.speedScore
    };
  }

  return baseMetrics;
}