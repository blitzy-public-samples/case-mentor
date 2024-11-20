// @package zod ^3.22.0
import { z } from 'zod';
import { DrillType, DrillResponse, DrillEvaluation } from '../../types/drills';
import { validateDrillAttempt } from '../../utils/validation';

/**
 * Human Tasks:
 * 1. Configure performance monitoring to track calculation response times
 * 2. Set up error tracking for calculation validation failures
 * 3. Review and adjust CALCULATION_TOLERANCE based on user feedback
 * 4. Implement caching for frequently used calculation patterns
 */

// Requirement: Calculations Drills - Global constants for calculation constraints
const CALCULATION_TOLERANCE = 0.01; // 1% tolerance for numerical answers
const MAX_CALCULATION_TIME = 300000; // 5 minutes maximum calculation time

// Requirement: Calculations Drills - Input validation schema
const CalculationInputSchema = z.object({
    value: z.string().regex(/^-?\d*\.?\d+$/),
    operators: z.array(z.enum(['+', '-', '*', '/', '%'])),
    maxDigits: z.number().int().positive(),
    decimalPlaces: z.number().int().min(0)
});

// Requirement: System Performance - Validation function with strict performance requirements
export async function validateCalculation(
    input: string,
    constraints: { maxDigits: number; decimalPlaces: number }
): Promise<boolean> {
    try {
        // Parse and validate numerical format
        const numericValue = parseFloat(input);
        if (isNaN(numericValue)) return false;

        // Validate against constraints
        const [integer, decimal] = input.replace('-', '').split('.');
        if (integer.length > constraints.maxDigits) return false;
        if (decimal && decimal.length > constraints.decimalPlaces) return false;

        // Validate mathematical operators
        const operatorRegex = /[+\-*/%]/g;
        const operators = input.match(operatorRegex) || [];
        const validOperators = operators.every(op => ['+', '-', '*', '/', '%'].includes(op));

        return validOperators;
    } catch (error) {
        return false;
    }
}

// Requirement: Case Math Drills - Evaluation function with detailed feedback
export async function evaluateCalculation(
    userAnswer: string,
    correctAnswer: number,
    evaluationCriteria: { timeLimit: number; precision: number }
): Promise<DrillEvaluation> {
    // Validate calculation format
    const isValid = await validateCalculation(userAnswer, {
        maxDigits: 10,
        decimalPlaces: 2
    });

    if (!isValid) {
        return {
            attemptId: '', // Will be set by the caller
            score: 0,
            feedback: 'Invalid calculation format',
            strengths: [],
            improvements: ['Ensure proper numerical format', 'Use valid mathematical operators'],
            evaluatedAt: new Date()
        };
    }

    // Compare with correct answer
    const userNumeric = parseFloat(userAnswer);
    const difference = Math.abs((userNumeric - correctAnswer) / correctAnswer);
    const withinTolerance = difference <= CALCULATION_TOLERANCE;

    // Calculate score based on accuracy
    const accuracyScore = withinTolerance ? 100 : Math.max(0, 100 - (difference * 100));

    return {
        attemptId: '', // Will be set by the caller
        score: accuracyScore,
        feedback: withinTolerance 
            ? 'Calculation correct within acceptable tolerance'
            : 'Calculation outside acceptable tolerance range',
        strengths: withinTolerance ? ['Accurate calculation', 'Proper numerical format'] : [],
        improvements: withinTolerance ? [] : ['Review calculation methodology', 'Check for rounding errors'],
        evaluatedAt: new Date()
    };
}

// Requirement: System Performance - Performance metrics calculation
export function calculateMetrics(
    timeSpent: number,
    accuracy: number,
    benchmarks: { targetTime: number; targetAccuracy: number }
): { speedScore: number; accuracyScore: number; efficiency: number } {
    // Calculate speed score
    const speedScore = Math.max(0, 100 * (1 - timeSpent / MAX_CALCULATION_TIME));

    // Calculate accuracy score relative to target
    const accuracyScore = (accuracy / benchmarks.targetAccuracy) * 100;

    // Calculate overall efficiency
    const efficiency = (speedScore + accuracyScore) / 2;

    return {
        speedScore: Math.min(100, speedScore),
        accuracyScore: Math.min(100, accuracyScore),
        efficiency: Math.min(100, efficiency)
    };
}

// Requirement: Calculations Drills - Main evaluator class
export class CalculationEvaluator {
    private tolerance: number;
    private benchmarks: {
        targetTime: number;
        targetAccuracy: number;
    };

    constructor(config: {
        tolerance?: number;
        benchmarks?: { targetTime: number; targetAccuracy: number };
    }) {
        this.tolerance = config.tolerance || CALCULATION_TOLERANCE;
        this.benchmarks = config.benchmarks || {
            targetTime: MAX_CALCULATION_TIME / 2,
            targetAccuracy: 95
        };
    }

    async evaluate(drillAttempt: {
        id: string;
        response: string;
        timeSpent: number;
        expectedAnswer: number;
    }): Promise<DrillEvaluation> {
        // Validate drill attempt
        await validateDrillAttempt({
            ...drillAttempt,
            type: DrillType.CALCULATION
        });

        // Evaluate calculation
        const evaluation = await evaluateCalculation(
            drillAttempt.response,
            drillAttempt.expectedAnswer,
            {
                timeLimit: MAX_CALCULATION_TIME,
                precision: 2
            }
        );

        // Calculate performance metrics
        const metrics = calculateMetrics(
            drillAttempt.timeSpent,
            evaluation.score,
            this.benchmarks
        );

        // Generate detailed feedback
        const feedback = this.generateFeedback({
            ...evaluation,
            metrics,
            timeSpent: drillAttempt.timeSpent
        });

        return {
            ...evaluation,
            attemptId: drillAttempt.id,
            feedback: feedback.summary,
            strengths: feedback.strengths,
            improvements: feedback.improvements
        };
    }

    generateFeedback(evaluationResult: {
        score: number;
        metrics: { speedScore: number; accuracyScore: number; efficiency: number };
        timeSpent: number;
    }): { summary: string; strengths: string[]; improvements: string[] } {
        const strengths: string[] = [];
        const improvements: string[] = [];

        // Analyze accuracy
        if (evaluationResult.score >= 95) {
            strengths.push('Excellent calculation accuracy');
        } else if (evaluationResult.score >= 80) {
            strengths.push('Good calculation accuracy');
            improvements.push('Review calculation for minor improvements');
        } else {
            improvements.push('Practice fundamental calculation techniques');
        }

        // Analyze speed
        if (evaluationResult.metrics.speedScore >= 90) {
            strengths.push('Exceptional calculation speed');
        } else if (evaluationResult.metrics.speedScore >= 70) {
            strengths.push('Good time management');
        } else {
            improvements.push('Work on improving calculation speed');
        }

        return {
            summary: `Achieved ${evaluationResult.score.toFixed(1)}% accuracy with ${evaluationResult.metrics.efficiency.toFixed(1)}% overall efficiency`,
            strengths,
            improvements
        };
    }
}