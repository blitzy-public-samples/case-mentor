// @package jest ^29.7.0
// @package @supabase/supabase-js ^2.38.0

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

import { DrillAttemptModel } from '../../models/DrillAttempt';
import { DrillType, DrillStatus } from '../../types/drills';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-id',
              user_id: 'user-123',
              drill_id: 'drill-456',
              status: 'COMPLETED',
              response: 'Test response',
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              time_spent: 300,
              evaluation: {
                score: 85,
                feedback: 'Good work',
                strengths: ['Clear structure'],
                improvements: ['Add more detail']
              }
            },
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('DrillAttemptModel', () => {
  let drillAttempt: DrillAttemptModel;
  const mockData = {
    id: 'test-id',
    userId: 'user-123',
    drillId: 'drill-456',
    status: DrillStatus.NOT_STARTED,
    response: '',
    startedAt: new Date(),
    completedAt: null,
    timeSpent: 0
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    drillAttempt = new DrillAttemptModel(mockData);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Requirement: Practice Drills - Test constructor validation
  describe('constructor', () => {
    it('should initialize with valid drill attempt data', () => {
      expect(drillAttempt).toBeInstanceOf(DrillAttemptModel);
      expect(drillAttempt.id).toBe(mockData.id);
      expect(drillAttempt.userId).toBe(mockData.userId);
      expect(drillAttempt.status).toBe(DrillStatus.NOT_STARTED);
    });

    it('should throw error for missing required fields', () => {
      expect(() => new DrillAttemptModel({
        ...mockData,
        userId: undefined
      } as any)).toThrow('Invalid input');
    });

    it('should set default NOT_STARTED status for new attempts', () => {
      const attempt = new DrillAttemptModel({
        ...mockData,
        status: undefined
      });
      expect(attempt.status).toBe(DrillStatus.NOT_STARTED);
    });

    it('should initialize startedAt timestamp', () => {
      expect(drillAttempt.startedAt).toBeInstanceOf(Date);
    });
  });

  // Requirement: Practice Drills - Test save method
  describe('save', () => {
    it('should save new drill attempt to database', async () => {
      const savedAttempt = await drillAttempt.save();
      expect(createClient).toHaveBeenCalled();
      expect(savedAttempt).toBeInstanceOf(DrillAttemptModel);
    });

    it('should update existing drill attempt', async () => {
      drillAttempt.response = 'Updated response';
      const savedAttempt = await drillAttempt.save();
      expect(savedAttempt.response).toBe('Updated response');
    });

    it('should handle validation errors', async () => {
      drillAttempt.userId = '';
      await expect(drillAttempt.save()).rejects.toThrow('Missing required fields');
    });

    it('should format data correctly for database insertion', async () => {
      await drillAttempt.save();
      const supabaseClient = createClient('', '');
      expect(supabaseClient.from).toHaveBeenCalledWith('drill_attempts');
      expect(supabaseClient.from().upsert).toHaveBeenCalledWith(expect.objectContaining({
        id: mockData.id,
        user_id: mockData.userId,
        drill_id: mockData.drillId
      }));
    });
  });

  // Requirement: Practice Drills - Test completion handling
  describe('complete', () => {
    const validResponse = 'This is a detailed response\nwith proper structure\nand content.';

    it('should mark drill as COMPLETED', async () => {
      const result = await drillAttempt.complete(validResponse);
      expect(drillAttempt.status).toBe(DrillStatus.COMPLETED);
      expect(result.evaluation).toBeDefined();
    });

    it('should calculate timeSpent from startedAt to completedAt', async () => {
      drillAttempt.startedAt = new Date(Date.now() - 300000); // 5 minutes ago
      await drillAttempt.complete(validResponse);
      expect(drillAttempt.timeSpent).toBeGreaterThan(0);
      expect(drillAttempt.timeSpent).toBeLessThanOrEqual(300);
    });

    it('should handle invalid responses', async () => {
      await expect(drillAttempt.complete('')).rejects.toThrow('Invalid response');
    });

    it('should validate response length', async () => {
      const tooLongResponse = 'a'.repeat(9000);
      await expect(drillAttempt.complete(tooLongResponse)).rejects.toThrow('Invalid response');
    });

    it('should save evaluation results', async () => {
      const result = await drillAttempt.complete(validResponse);
      expect(result.evaluation.score).toBeDefined();
      expect(result.evaluation.feedback).toBeDefined();
      expect(drillAttempt.evaluation).toBeDefined();
    });
  });

  // Requirement: User Engagement - Test metrics calculation
  describe('calculateMetrics', () => {
    beforeEach(() => {
      drillAttempt.response = 'Test response with content\nand structure';
      drillAttempt.timeSpent = 300;
      drillAttempt.evaluation = {
        attemptId: 'test-id',
        score: 85,
        feedback: 'Good work',
        strengths: ['Clear structure'],
        improvements: ['Add more detail'],
        evaluatedAt: new Date()
      };
    });

    it('should calculate completion percentage', () => {
      const metrics = drillAttempt.calculateMetrics();
      expect(metrics.completeness).toBeGreaterThan(0);
      expect(metrics.completeness).toBeLessThanOrEqual(100);
    });

    it('should compute time-based metrics', () => {
      const metrics = drillAttempt.calculateMetrics();
      expect(metrics.timeSpent).toBe(300);
      expect(metrics.speed).toBeGreaterThan(0);
      expect(metrics.speed).toBeLessThanOrEqual(100);
    });

    it('should handle missing evaluation data', () => {
      drillAttempt.evaluation = null;
      const metrics = drillAttempt.calculateMetrics();
      expect(metrics.accuracy).toBe(0);
    });

    it('should normalize metrics to 0-100 scale', () => {
      const metrics = drillAttempt.calculateMetrics();
      expect(metrics.completeness).toBeGreaterThanOrEqual(0);
      expect(metrics.completeness).toBeLessThanOrEqual(100);
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(100);
      expect(metrics.speed).toBeGreaterThanOrEqual(0);
      expect(metrics.speed).toBeLessThanOrEqual(100);
    });

    it('should include accuracy metrics when evaluation exists', () => {
      const metrics = drillAttempt.calculateMetrics();
      expect(metrics.accuracy).toBe(85);
    });
  });
});