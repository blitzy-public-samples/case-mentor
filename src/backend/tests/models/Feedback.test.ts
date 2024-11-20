// @package jest ^29.7.0
// @package @faker-js/faker ^8.3.1

import { describe, it, expect, beforeEach, afterEach } from 'jest';
import { faker } from '@faker-js/faker';
import { Feedback } from '../../models/Feedback';
import { executeQuery } from '../../utils/database';
import { APIError, APIErrorCode } from '../../types/api';

/**
 * Human Tasks:
 * 1. Configure test database with appropriate tables and relations for feedback testing
 * 2. Set up test data cleanup procedures in CI/CD pipeline
 * 3. Configure test coverage thresholds in Jest configuration
 * 4. Set up automated test runs in the deployment pipeline
 */

// Helper function to generate test feedback data
const generateTestFeedback = (overrides = {}) => {
    const testData = {
        id: faker.string.uuid(),
        attemptId: faker.string.uuid(),
        type: faker.helpers.arrayElement(['DRILL', 'SIMULATION']),
        content: {
            summary: faker.lorem.paragraph(),
            strengths: Array.from({ length: 3 }, () => faker.lorem.sentence()),
            improvements: Array.from({ length: 3 }, () => faker.lorem.sentence()),
            recommendations: Array.from({ length: 3 }, () => faker.lorem.sentence())
        },
        score: faker.number.int({ min: 0, max: 100 }),
        metrics: Array.from({ length: 3 }, () => ({
            name: faker.lorem.word(),
            score: faker.number.int({ min: 0, max: 100 }),
            comments: faker.lorem.sentence()
        })),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return { ...testData, ...overrides };
};

// Helper function to clean up test data
const cleanupTestData = async () => {
    await executeQuery(
        'delete_test_feedback',
        [],
        { timeout: 5000 }
    );
};

describe('Feedback Model', () => {
    beforeEach(async () => {
        await cleanupTestData();
    });

    afterEach(async () => {
        await cleanupTestData();
    });

    // Requirement: AI Evaluation - Verify consistent and objective feedback
    describe('constructor', () => {
        it('should create new Feedback instance with valid data', () => {
            const testData = generateTestFeedback();
            const feedback = new Feedback(testData);

            expect(feedback).toBeInstanceOf(Feedback);
            expect(feedback.id).toBe(testData.id);
            expect(feedback.attemptId).toBe(testData.attemptId);
            expect(feedback.type).toBe(testData.type);
            expect(feedback.content).toEqual(testData.content);
            expect(feedback.score).toBe(testData.score);
            expect(feedback.metrics).toEqual(testData.metrics);
        });

        it('should throw APIError with VALIDATION_ERROR code for invalid data', () => {
            const invalidData = generateTestFeedback({ score: 150 });

            expect(() => new Feedback(invalidData))
                .toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });

        it('should set default values correctly for optional fields', () => {
            const minimalData = {
                attemptId: faker.string.uuid(),
                type: 'DRILL',
                content: {
                    summary: faker.lorem.paragraph(),
                    strengths: [faker.lorem.sentence()],
                    improvements: [faker.lorem.sentence()],
                    recommendations: [faker.lorem.sentence()]
                },
                score: 80,
                metrics: [{
                    name: 'test',
                    score: 80,
                    comments: 'test comments'
                }]
            };

            const feedback = new Feedback(minimalData);
            expect(feedback.id).toMatch(/^[0-9a-f-]{36}$/);
            expect(feedback.createdAt).toBeInstanceOf(Date);
            expect(feedback.updatedAt).toBeInstanceOf(Date);
        });

        it('should validate content object structure', () => {
            const invalidContent = generateTestFeedback({
                content: { summary: 'Invalid content' }
            });

            expect(() => new Feedback(invalidContent))
                .toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });

        it('should validate metrics array format', () => {
            const invalidMetrics = generateTestFeedback({
                metrics: [{ name: 'Invalid metric' }]
            });

            expect(() => new Feedback(invalidMetrics))
                .toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });
    });

    // Requirement: Performance Analytics - Ensure accurate progress tracking
    describe('save', () => {
        it('should persist valid feedback to database with all fields', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const saved = await Feedback.findById(feedback.id);
            expect(saved).toBeTruthy();
            expect(saved?.content).toEqual(feedback.content);
            expect(saved?.metrics).toEqual(feedback.metrics);
        });

        it('should generate ISO format creation timestamp', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const saved = await Feedback.findById(feedback.id);
            expect(saved?.createdAt.toISOString()).toBe(feedback.createdAt.toISOString());
        });

        it('should throw APIError with VALIDATION_ERROR for invalid data', async () => {
            const feedback = new Feedback(generateTestFeedback());
            // @ts-ignore - Testing invalid data
            feedback.score = 150;

            await expect(feedback.save())
                .rejects.toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });

        it('should update attempt with feedback reference in transaction', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const result = await executeQuery(
                'select_attempt_feedback_ref',
                [feedback.attemptId]
            );
            expect(result).toBeTruthy();
            expect(result.feedbackId).toBe(feedback.id);
        });

        it('should handle database errors properly', async () => {
            const feedback = new Feedback(generateTestFeedback());
            jest.spyOn(executeQuery, 'mockImplementation').mockRejectedValueOnce(new Error('DB Error'));

            await expect(feedback.save())
                .rejects.toThrow('Failed to save feedback');
        });
    });

    // Requirement: Performance Analytics - Ensure accurate progress tracking
    describe('update', () => {
        it('should update existing feedback with valid data', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const updateData = {
                content: {
                    summary: 'Updated summary',
                    strengths: ['Updated strength'],
                    improvements: ['Updated improvement'],
                    recommendations: ['Updated recommendation']
                }
            };

            await feedback.update(updateData);
            const updated = await Feedback.findById(feedback.id);
            expect(updated?.content).toEqual(updateData.content);
        });

        it('should throw APIError with NOT_FOUND if feedback not found', async () => {
            const feedback = new Feedback(generateTestFeedback());
            
            await expect(feedback.update({ score: 90 }))
                .rejects.toThrow(expect.objectContaining({
                    code: APIErrorCode.NOT_FOUND
                }));
        });

        it('should validate update data structure', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            await expect(feedback.update({ score: 150 }))
                .rejects.toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });

        it('should update related metrics in transaction', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const newMetrics = [{
                name: 'Updated metric',
                score: 90,
                comments: 'Updated comments'
            }];

            await feedback.update({ metrics: newMetrics });
            const updated = await Feedback.findById(feedback.id);
            expect(updated?.metrics).toEqual(newMetrics);
        });

        it('should handle concurrent updates properly', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const update1 = feedback.update({ score: 85 });
            const update2 = feedback.update({ score: 90 });

            await expect(Promise.all([update1, update2]))
                .rejects.toThrow();
        });
    });

    // Requirement: Performance Analytics - Ensure accurate progress tracking
    describe('delete', () => {
        it('should remove feedback from database with cleanup', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            await feedback.delete();
            const deleted = await Feedback.findById(feedback.id);
            expect(deleted).toBeNull();
        });

        it('should throw APIError with NOT_FOUND if feedback not found', async () => {
            const feedback = new Feedback(generateTestFeedback());

            await expect(feedback.delete())
                .rejects.toThrow(expect.objectContaining({
                    code: APIErrorCode.NOT_FOUND
                }));
        });

        it('should remove feedback reference from attempt in transaction', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();
            await feedback.delete();

            const result = await executeQuery(
                'select_attempt_feedback_ref',
                [feedback.attemptId]
            );
            expect(result.feedbackId).toBeNull();
        });

        it('should handle deletion errors properly', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            jest.spyOn(executeQuery, 'mockImplementation').mockRejectedValueOnce(new Error('DB Error'));

            await expect(feedback.delete())
                .rejects.toThrow('Failed to delete feedback');
        });
    });

    // Requirement: Performance Analytics - Ensure accurate progress tracking
    describe('findById', () => {
        it('should return feedback by ID with all fields', async () => {
            const feedback = new Feedback(generateTestFeedback());
            await feedback.save();

            const found = await Feedback.findById(feedback.id);
            expect(found).toBeTruthy();
            expect(found?.id).toBe(feedback.id);
            expect(found?.content).toEqual(feedback.content);
            expect(found?.metrics).toEqual(feedback.metrics);
        });

        it('should return null if feedback not found', async () => {
            const result = await Feedback.findById(faker.string.uuid());
            expect(result).toBeNull();
        });

        it('should throw APIError with VALIDATION_ERROR for invalid ID format', async () => {
            await expect(Feedback.findById('invalid-id'))
                .rejects.toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });

        it('should handle database query errors', async () => {
            jest.spyOn(executeQuery, 'mockImplementation').mockRejectedValueOnce(new Error('DB Error'));

            await expect(Feedback.findById(faker.string.uuid()))
                .rejects.toThrow('Failed to find feedback');
        });
    });

    // Requirement: Performance Analytics - Ensure accurate progress tracking
    describe('findByAttempt', () => {
        it('should return all feedback for attempt sorted by date', async () => {
            const attemptId = faker.string.uuid();
            const feedback1 = new Feedback(generateTestFeedback({ attemptId }));
            const feedback2 = new Feedback(generateTestFeedback({ attemptId }));
            
            await feedback1.save();
            await feedback2.save();

            const results = await Feedback.findByAttempt(attemptId);
            expect(results).toHaveLength(2);
            expect(new Date(results[0].createdAt) >= new Date(results[1].createdAt)).toBeTruthy();
        });

        it('should return empty array if no feedback found', async () => {
            const results = await Feedback.findByAttempt(faker.string.uuid());
            expect(results).toEqual([]);
        });

        it('should validate attempt ID format', async () => {
            await expect(Feedback.findByAttempt('invalid-id'))
                .rejects.toThrow(expect.objectContaining({
                    code: APIErrorCode.VALIDATION_ERROR
                }));
        });

        it('should handle database query errors', async () => {
            jest.spyOn(executeQuery, 'mockImplementation').mockRejectedValueOnce(new Error('DB Error'));

            await expect(Feedback.findByAttempt(faker.string.uuid()))
                .rejects.toThrow('Failed to find feedback by attempt');
        });
    });
});