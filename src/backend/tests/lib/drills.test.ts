// @package jest ^29.0.0
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import type { MockInstance } from 'jest-mock';

import { 
  DrillType, 
  DrillResponse, 
  DrillEvaluation, 
  DrillEvaluationCriteria, 
  DrillResult, 
  DrillMetrics 
} from '../../lib/drills/types';

import { 
  evaluateDrillAttempt,
  calculateDrillMetrics 
} from '../../lib/drills/evaluator';

import {
  CalculationEvaluator,
  validateCalculation,
  calculateMetrics
} from '../../lib/drills/calculator';

/**
 * Human Tasks:
 * 1. Configure test environment variables for OpenAI API integration
 * 2. Set up test data fixtures for different drill types
 * 3. Configure test timeouts based on actual API response times
 * 4. Set up test coverage monitoring
 */

// Mock OpenAI service responses
jest.mock('../../lib/openai', () => ({
  evaluateDrillResponse: jest.fn(),
  generateFeedback: jest.fn()
}));

// Test data setup
const mockEvaluationCriteria: DrillEvaluationCriteria = {
  drillType: DrillType.CASE_PROMPT,
  rubric: {
    criteria: ['Structure', 'Analysis', 'Communication'],
    scoringGuide: {
      Structure: 'Clear MECE framework',
      Analysis: 'Data-driven insights',
      Communication: 'Clear and concise'
    },
    maxScore: 100
  },
  weights: {
    Structure: 0.4,
    Analysis: 0.4,
    Communication: 0.2
  }
};

const mockDrillResponse: DrillResponse<string> = {
  success: true,
  data: 'Test response content',
  error: null
};

describe('DrillEvaluator', () => {
  // Requirement: AI Evaluation - Test core evaluation functionality
  describe('evaluateDrillAttempt', () => {
    let evaluateDrillResponseMock: MockInstance;
    
    beforeEach(() => {
      evaluateDrillResponseMock = jest.fn().mockResolvedValue({
        score: 85,
        feedback: 'Good structure and analysis',
        strengths: ['Clear framework', 'Logical flow'],
        improvements: ['Add more quantitative analysis'],
        evaluatedAt: new Date()
      });
    });

    test('should successfully evaluate a drill attempt', async () => {
      const result = await evaluateDrillAttempt(
        DrillType.CASE_PROMPT,
        'Test prompt',
        'Test response',
        mockEvaluationCriteria
      );

      expect(result).toHaveProperty('evaluation');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('feedback');
      expect(result.evaluation.score).toBe(85);
    });

    test('should handle evaluation timeout', async () => {
      evaluateDrillResponseMock.mockRejectedValue(new Error('Evaluation timeout'));

      await expect(
        evaluateDrillAttempt(
          DrillType.CASE_PROMPT,
          'Test prompt',
          'Test response',
          mockEvaluationCriteria
        )
      ).rejects.toThrow('Evaluation timeout');
    });

    // Requirement: System Performance - Test response time
    test('should complete evaluation within 200ms', async () => {
      const startTime = Date.now();
      
      await evaluateDrillAttempt(
        DrillType.CASE_PROMPT,
        'Test prompt',
        'Test response',
        mockEvaluationCriteria
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });
  });

  // Requirement: Practice Drills - Test metrics calculation
  describe('calculateDrillMetrics', () => {
    test('should calculate accurate metrics for all drill types', () => {
      const response = 'Test response with framework and numerical analysis: 100';
      const timeSpent = 180000; // 3 minutes

      const metrics = calculateDrillMetrics(
        response,
        timeSpent,
        DrillType.CASE_PROMPT
      );

      expect(metrics).toMatchObject({
        timeSpent: expect.any(Number),
        completeness: expect.any(Number),
        accuracy: expect.any(Number),
        speed: expect.any(Number)
      });

      expect(metrics.completeness).toBeGreaterThan(0);
      expect(metrics.completeness).toBeLessThanOrEqual(100);
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(100);
    });
  });
});

describe('CalculationEvaluator', () => {
  let calculator: CalculationEvaluator;

  beforeEach(() => {
    calculator = new CalculationEvaluator({
      tolerance: 0.01,
      benchmarks: {
        targetTime: 180,
        targetAccuracy: 95
      }
    });
  });

  // Requirement: Practice Drills - Test calculation validation
  test('should validate calculation format', async () => {
    const validInputs = ['123.45', '-567.89', '1000'];
    const invalidInputs = ['abc', '12.34.56', ''];

    for (const input of validInputs) {
      const isValid = await validateCalculation(input, {
        maxDigits: 10,
        decimalPlaces: 2
      });
      expect(isValid).toBe(true);
    }

    for (const input of invalidInputs) {
      const isValid = await validateCalculation(input, {
        maxDigits: 10,
        decimalPlaces: 2
      });
      expect(isValid).toBe(false);
    }
  });

  // Requirement: AI Evaluation - Test calculation evaluation
  test('should evaluate calculation accuracy', async () => {
    const evaluation = await calculator.evaluate({
      id: 'test-id',
      response: '123.45',
      timeSpent: 60000,
      expectedAnswer: 123.45
    });

    expect(evaluation.score).toBe(100);
    expect(evaluation.feedback).toContain('Calculation correct');
    expect(evaluation.strengths).toHaveLength(2);
  });

  // Requirement: Practice Drills - Test metrics computation
  test('should calculate performance metrics', () => {
    const metrics = calculateMetrics(60000, 100, {
      targetTime: 180,
      targetAccuracy: 95
    });

    expect(metrics).toMatchObject({
      speedScore: expect.any(Number),
      accuracyScore: expect.any(Number),
      efficiency: expect.any(Number)
    });

    expect(metrics.speedScore).toBeGreaterThan(0);
    expect(metrics.accuracyScore).toBeGreaterThan(0);
    expect(metrics.efficiency).toBeGreaterThan(0);
  });

  // Requirement: System Performance - Test error handling
  test('should handle invalid calculation input', async () => {
    await expect(
      calculator.evaluate({
        id: 'test-id',
        response: 'invalid',
        timeSpent: 60000,
        expectedAnswer: 123.45
      })
    ).rejects.toThrow('Invalid calculation format');
  });
});