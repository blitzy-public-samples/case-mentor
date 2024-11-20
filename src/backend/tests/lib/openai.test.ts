// @package jest ^29.0.0
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
// @package openai ^4.0.0
import OpenAI from 'openai';

import { OpenAIService, evaluateDrillResponse, generateFeedback } from '../../lib/openai';
import { DRILL_PROMPTS } from '../../lib/openai/prompts';
import { openaiConfig } from '../../config/openai';
import { DrillType } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Configure test environment variables with test OpenAI API key
 * 2. Set up monitoring for test coverage metrics
 * 3. Configure test timeouts based on actual API response patterns
 * 4. Set up error tracking for failed test cases
 */

// Mock OpenAI client
jest.mock('openai');

describe('OpenAIService Integration Tests', () => {
  let service: OpenAIService;
  const mockOpenAIResponse = jest.fn();
  const mockDrillResponse = 'Sample drill response for testing';
  const mockEvaluationCriteria = {
    drillType: DrillType.CASE_PROMPT,
    rubric: {
      clarity: 0.3,
      structure: 0.3,
      analysis: 0.4
    },
    weights: {
      clarity: 30,
      structure: 30,
      analysis: 40
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock OpenAI API responses
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockOpenAIResponse
        }
      }
    } as any));

    // Initialize service with test config
    service = new OpenAIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: AI Evaluation - Verify evaluation functionality
  describe('evaluateDrillResponse', () => {
    it('should evaluate drill responses with correct scoring', async () => {
      const mockEvaluation = {
        choices: [{
          message: {
            content: {
              score: 85,
              feedback: 'Good structure and analysis',
              strengths: ['Clear framework', 'Logical flow'],
              improvements: ['Add more quantitative analysis']
            }
          }
        }]
      };

      mockOpenAIResponse.mockResolvedValueOnce(mockEvaluation);

      const result = await evaluateDrillResponse(
        DrillType.CASE_PROMPT,
        mockDrillResponse,
        mockEvaluationCriteria
      );

      expect(result).toHaveProperty('score', 85);
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('improvements');
      expect(result.evaluatedAt).toBeInstanceOf(Date);
    });

    it('should handle different drill types correctly', async () => {
      const drillTypes = [DrillType.CALCULATION, DrillType.MARKET_SIZING];
      
      for (const drillType of drillTypes) {
        mockOpenAIResponse.mockResolvedValueOnce({
          choices: [{
            message: {
              content: {
                score: 80,
                feedback: 'Test feedback',
                strengths: ['Test strength'],
                improvements: ['Test improvement']
              }
            }
          }]
        });

        const result = await evaluateDrillResponse(
          drillType,
          mockDrillResponse,
          { ...mockEvaluationCriteria, drillType }
        );

        expect(result).toBeDefined();
        expect(mockOpenAIResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: DRILL_PROMPTS[drillType]
              })
            ])
          })
        );
      }
    });
  });

  // Requirement: AI Evaluation - Test feedback generation
  describe('generateFeedback', () => {
    it('should generate detailed feedback from evaluation results', async () => {
      const mockFeedbackResponse = {
        choices: [{
          message: {
            content: 'Detailed feedback with specific suggestions'
          }
        }]
      };

      mockOpenAIResponse.mockResolvedValueOnce(mockFeedbackResponse);

      const evaluation = {
        score: 85,
        strengths: ['Clear structure', 'Good analysis'],
        improvements: ['More quantitative support']
      };

      const feedback = await generateFeedback(evaluation);

      expect(feedback).toBe('Detailed feedback with specific suggestions');
      expect(mockOpenAIResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
          presence_penalty: 0.2,
          frequency_penalty: 0.2
        })
      );
    });
  });

  // Requirement: System Performance - Test error handling
  describe('error handling', () => {
    it('should handle API failures with proper retries', async () => {
      mockOpenAIResponse
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: {
                score: 80,
                feedback: 'Test feedback',
                strengths: ['Test strength'],
                improvements: ['Test improvement']
              }
            }
          }]
        });

      const result = await evaluateDrillResponse(
        DrillType.CASE_PROMPT,
        mockDrillResponse,
        mockEvaluationCriteria
      );

      expect(result).toBeDefined();
      expect(mockOpenAIResponse).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockOpenAIResponse.mockRejectedValue(new Error('API Error'));

      await expect(
        evaluateDrillResponse(
          DrillType.CASE_PROMPT,
          mockDrillResponse,
          mockEvaluationCriteria
        )
      ).rejects.toThrow('API Error');
    });
  });

  // Requirement: System Performance - Test response times
  describe('performance', () => {
    it('should meet 200ms response time target', async () => {
      mockOpenAIResponse.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              choices: [{
                message: {
                  content: {
                    score: 80,
                    feedback: 'Quick response',
                    strengths: ['Fast'],
                    improvements: ['None']
                  }
                }
              }]
            }), 
            150
          )
        )
      );

      const startTime = Date.now();
      await evaluateDrillResponse(
        DrillType.CASE_PROMPT,
        mockDrillResponse,
        mockEvaluationCriteria
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle timeout correctly', async () => {
      mockOpenAIResponse.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => 
            resolve({
              choices: [{
                message: {
                  content: 'Delayed response'
                }
              }]
            }), 
            11000
          )
        )
      );

      await expect(
        generateFeedback({
          score: 85,
          strengths: ['Test'],
          improvements: ['Test']
        })
      ).rejects.toThrow();
    });
  });
});