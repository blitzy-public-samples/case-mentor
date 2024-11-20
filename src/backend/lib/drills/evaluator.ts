// @package zod ^3.22.0
import { z } from 'zod';

import { 
  DrillType, 
  DrillEvaluationSchema 
} from '../../types/drills';

import { 
  DrillEvaluationCriteria, 
  DrillResult, 
  DrillMetrics,
  EVALUATION_CRITERIA_SCHEMA,
  METRICS_SCHEMA
} from './types';

import { evaluateDrillResponse } from '../openai';
import { openaiConfig } from '../../config/openai';

/**
 * Human Tasks:
 * 1. Monitor evaluation response times and adjust timeouts if needed
 * 2. Set up error tracking for evaluation failures
 * 3. Configure analytics for evaluation metrics
 * 4. Review and adjust scoring weights based on user performance data
 */

// Requirement: System Performance - Timeout configuration
const EVALUATION_TIMEOUT = 30000; // 30 seconds
const MAX_RESPONSE_LENGTH = 8000; // Maximum characters for evaluation

/**
 * Requirement: AI Evaluation - Main evaluation function with retry and timeout handling
 */
export async function evaluateDrillAttempt(
  drillType: DrillType,
  prompt: string,
  response: string,
  criteria: DrillEvaluationCriteria
): Promise<DrillResult> {
  // Validate input parameters
  if (!response || response.length > MAX_RESPONSE_LENGTH) {
    throw new Error(`Response length must be between 1 and ${MAX_RESPONSE_LENGTH} characters`);
  }

  if (!EVALUATION_CRITERIA_SCHEMA.safeParse(criteria).success) {
    throw new Error('Invalid evaluation criteria format');
  }

  // Calculate initial metrics
  const timeSpent = Date.now(); // Timestamp for performance tracking
  const metrics = calculateDrillMetrics(response, timeSpent, drillType);

  try {
    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EVALUATION_TIMEOUT);

    // Evaluate response using OpenAI
    const evaluation = await Promise.race([
      evaluateDrillResponse(drillType, response, criteria),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), EVALUATION_TIMEOUT)
      )
    ]);

    clearTimeout(timeoutId);

    // Validate evaluation result
    if (!validateEvaluation(evaluation, criteria)) {
      throw new Error('Invalid evaluation result format');
    }

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
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error(`Evaluation timed out after ${EVALUATION_TIMEOUT}ms`);
    }
    throw error;
  }
}

/**
 * Requirement: Practice Drills - Calculate standardized performance metrics
 */
export function calculateDrillMetrics(
  response: string,
  timeSpent: number,
  drillType: DrillType
): DrillMetrics {
  // Calculate completeness score based on response length and structure
  const completeness = Math.min(
    (response.length / MAX_RESPONSE_LENGTH) * 100,
    100
  );

  // Calculate time-based efficiency score
  const expectedTime = {
    [DrillType.CASE_PROMPT]: 300,    // 5 minutes
    [DrillType.CALCULATION]: 180,    // 3 minutes
    [DrillType.CASE_MATH]: 240,      // 4 minutes
    [DrillType.BRAINSTORMING]: 180,  // 3 minutes
    [DrillType.MARKET_SIZING]: 300,  // 5 minutes
    [DrillType.SYNTHESIZING]: 240    // 4 minutes
  }[drillType];

  const timeScore = Math.max(
    0,
    100 - ((timeSpent / (expectedTime * 1000) - 1) * 50)
  );

  // Calculate accuracy based on response structure and keywords
  const accuracyFactors = {
    hasFramework: /framework|approach|methodology/i.test(response),
    hasNumbers: /\d+/.test(response),
    hasConclusion: /conclusion|therefore|thus|summary/i.test(response),
    hasStructure: response.includes('\n') && response.length > 100
  };

  const accuracy = Object.values(accuracyFactors)
    .filter(Boolean)
    .length * 25;

  const metrics: DrillMetrics = {
    timeSpent: Math.round(timeSpent / 1000), // Convert to seconds
    completeness: Math.round(completeness),
    accuracy: Math.round(accuracy),
    speed: Math.round(timeScore)
  };

  // Validate metrics
  if (!METRICS_SCHEMA.safeParse(metrics).success) {
    throw new Error('Invalid metrics calculation');
  }

  return metrics;
}

/**
 * Requirement: AI Evaluation - Validate evaluation result structure
 */
function validateEvaluation(
  evaluation: any,
  criteria: DrillEvaluationCriteria
): boolean {
  // Validate basic structure
  if (!evaluation || typeof evaluation !== 'object') {
    return false;
  }

  // Validate using Zod schema
  const isValidStructure = DrillEvaluationSchema.safeParse(evaluation).success;
  if (!isValidStructure) {
    return false;
  }

  // Validate score ranges
  if (evaluation.score < 0 || evaluation.score > 100) {
    return false;
  }

  // Validate feedback completeness
  const hasRequiredFeedback = 
    Array.isArray(evaluation.strengths) &&
    Array.isArray(evaluation.improvements) &&
    evaluation.strengths.length > 0 &&
    evaluation.improvements.length > 0 &&
    typeof evaluation.feedback === 'string' &&
    evaluation.feedback.length > 0;

  if (!hasRequiredFeedback) {
    return false;
  }

  // Validate against evaluation criteria
  const criteriaKeys = Object.keys(criteria.weights);
  const hasCriteriaFeedback = criteriaKeys.every(key => 
    evaluation.feedback.includes(key)
  );

  return hasCriteriaFeedback;
}