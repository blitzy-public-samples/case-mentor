// @package jest ^29.0.0
// @package jest-mock ^29.0.0

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FeedbackService } from '../../services/FeedbackService';
import { Feedback } from '../../models/Feedback';
import { OpenAIService } from '../../lib/openai';
import { APIError } from '../../types/api';
import { DrillType } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Configure test environment with proper OpenAI API mocking
 * 2. Set up test database with appropriate test data isolation
 * 3. Configure performance monitoring for test execution times
 * 4. Set up test coverage reporting and thresholds
 */

// Mock external dependencies
jest.mock('../../models/Feedback');
jest.mock('../../lib/openai');

describe('FeedbackService', () => {
    let feedbackService: FeedbackService;
    let mockOpenAIService: jest.Mocked<OpenAIService>;
    let mockFeedback: jest.Mocked<typeof Feedback>;

    // Test data setup
    const setupTestData = () => ({
        attemptId: '123e4567-e89b-12d3-a456-426614174000',
        type: DrillType.CASE_PROMPT,
        response: {
            content: 'Test response content',
            metrics: [
                { name: 'structure', value: 85 },
                { name: 'clarity', value: 90 }
            ]
        },
        evaluation: {
            score: 88,
            strengths: ['Clear structure', 'Logical flow'],
            improvements: ['Add more quantitative analysis'],
            recommendations: ['Practice market sizing']
        },
        feedback: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            content: {
                summary: 'Good attempt with clear structure',
                strengths: ['Clear structure', 'Logical flow'],
                improvements: ['Add more quantitative analysis'],
                recommendations: ['Practice market sizing']
            },
            score: 88,
            metrics: [
                { name: 'structure', score: 85 },
                { name: 'clarity', score: 90 }
            ]
        }
    });

    // Mock setup
    const setupMocks = () => {
        mockOpenAIService = {
            evaluateDrillResponse: jest.fn(),
            generateFeedback: jest.fn()
        } as unknown as jest.Mocked<OpenAIService>;

        mockFeedback = {
            findById: jest.fn(),
            findByAttempt: jest.fn(),
            save: jest.fn()
        } as unknown as jest.Mocked<typeof Feedback>;

        // Type assertion to avoid TypeScript errors
        (Feedback as unknown as jest.Mock).mockImplementation(() => ({
            save: mockFeedback.save,
            id: '123e4567-e89b-12d3-a456-426614174001'
        }));
    };

    beforeEach(() => {
        setupMocks();
        feedbackService = new FeedbackService(mockOpenAIService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateFeedback', () => {
        // Requirement: AI Evaluation - Verify consistent, objective feedback
        it('should generate and store feedback successfully', async () => {
            const testData = setupTestData();
            
            mockOpenAIService.evaluateDrillResponse.mockResolvedValue(testData.evaluation);
            mockOpenAIService.generateFeedback.mockResolvedValue(testData.feedback.content.summary);
            mockFeedback.save.mockResolvedValue(undefined);

            const result = await feedbackService.generateFeedback(
                testData.attemptId,
                testData.type,
                testData.response
            );

            expect(result).toBeDefined();
            expect(result.id).toBe(testData.feedback.id);
            expect(result.content).toEqual(testData.feedback.content);
            expect(result.score).toBe(testData.feedback.score);
            expect(mockFeedback.save).toHaveBeenCalled();
        });

        // Requirement: AI Evaluation - Validate error handling
        it('should handle invalid feedback request data', async () => {
            const invalidData = {
                attemptId: 'invalid-id',
                type: 'INVALID_TYPE',
                response: {}
            };

            await expect(
                feedbackService.generateFeedback(
                    invalidData.attemptId,
                    invalidData.type,
                    invalidData.response
                )
            ).rejects.toThrow('Invalid feedback request data');
        });

        // Requirement: System Performance - Validate response time
        it('should generate feedback within performance requirements', async () => {
            const testData = setupTestData();
            const startTime = Date.now();

            mockOpenAIService.evaluateDrillResponse.mockResolvedValue(testData.evaluation);
            mockOpenAIService.generateFeedback.mockResolvedValue(testData.feedback.content.summary);
            mockFeedback.save.mockResolvedValue(undefined);

            await feedbackService.generateFeedback(
                testData.attemptId,
                testData.type,
                testData.response
            );

            const endTime = Date.now();
            const executionTime = endTime - startTime;
            
            expect(executionTime).toBeLessThan(200); // Requirement: <200ms response time
        });
    });

    describe('getFeedback', () => {
        // Requirement: System Performance - Validate caching mechanism
        it('should return cached feedback when available', async () => {
            const testData = setupTestData();
            const feedbackId = testData.feedback.id;

            // First call to populate cache
            mockFeedback.findById.mockResolvedValue(testData.feedback);
            await feedbackService.getFeedback(feedbackId);

            // Second call should use cache
            mockFeedback.findById.mockClear();
            const result = await feedbackService.getFeedback(feedbackId);

            expect(result).toEqual(testData.feedback);
            expect(mockFeedback.findById).not.toHaveBeenCalled();
        });

        it('should fetch from database when cache is empty', async () => {
            const testData = setupTestData();
            const feedbackId = testData.feedback.id;

            mockFeedback.findById.mockResolvedValue(testData.feedback);
            const result = await feedbackService.getFeedback(feedbackId);

            expect(result).toEqual(testData.feedback);
            expect(mockFeedback.findById).toHaveBeenCalledWith(feedbackId);
        });

        it('should return null for non-existent feedback', async () => {
            mockFeedback.findById.mockResolvedValue(null);
            const result = await feedbackService.getFeedback('non-existent-id');

            expect(result).toBeNull();
        });
    });

    describe('getAttemptFeedback', () => {
        it('should retrieve all feedback for an attempt', async () => {
            const testData = setupTestData();
            const attemptId = testData.attemptId;
            const feedbackArray = [testData.feedback];

            mockFeedback.findByAttempt.mockResolvedValue(feedbackArray);
            const result = await feedbackService.getAttemptFeedback(attemptId);

            expect(result).toEqual(feedbackArray);
            expect(mockFeedback.findByAttempt).toHaveBeenCalledWith(attemptId);
        });

        it('should handle invalid attempt ID format', async () => {
            await expect(
                feedbackService.getAttemptFeedback('invalid-id')
            ).rejects.toThrow('Invalid attempt ID format');
        });
    });

    describe('updateFeedback', () => {
        it('should update existing feedback', async () => {
            const testData = setupTestData();
            const feedbackId = testData.feedback.id;
            const updateData = {
                content: {
                    summary: 'Updated summary'
                }
            };

            mockFeedback.findById.mockResolvedValue({
                ...testData.feedback,
                update: jest.fn().mockResolvedValue(undefined)
            });

            await feedbackService.updateFeedback(feedbackId, updateData);
            expect(mockFeedback.findById).toHaveBeenCalledWith(feedbackId);
        });

        it('should throw error for non-existent feedback', async () => {
            mockFeedback.findById.mockResolvedValue(null);

            await expect(
                feedbackService.updateFeedback('non-existent-id', {})
            ).rejects.toThrow('Feedback not found');
        });

        // Requirement: System Performance - Validate cache invalidation
        it('should invalidate cache after update', async () => {
            const testData = setupTestData();
            const feedbackId = testData.feedback.id;
            const updateData = {
                content: {
                    summary: 'Updated summary'
                }
            };

            mockFeedback.findById.mockResolvedValue({
                ...testData.feedback,
                update: jest.fn().mockResolvedValue(undefined)
            });

            // First, populate cache
            await feedbackService.getFeedback(feedbackId);

            // Then update feedback
            await feedbackService.updateFeedback(feedbackId, updateData);

            // Verify cache is invalidated by checking if database is queried again
            mockFeedback.findById.mockClear();
            await feedbackService.getFeedback(feedbackId);
            expect(mockFeedback.findById).toHaveBeenCalled();
        });
    });
});