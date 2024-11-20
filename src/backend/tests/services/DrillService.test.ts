// @package jest ^29.7.0
// @package @supabase/supabase-js ^2.38.0
// @package ioredis ^5.3.0

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

import { DrillService } from '../../services/DrillService';
import { 
  DrillType, 
  DrillStatus, 
  DrillPrompt, 
  DrillAttempt,
  DrillEvaluation,
  DrillDifficulty 
} from '../../types/drills';
import { DrillAttemptModel } from '../../models/DrillAttempt';

/**
 * Human Tasks:
 * 1. Configure test database with proper test data fixtures
 * 2. Set up monitoring for test execution times to ensure <200ms requirement
 * 3. Configure test coverage reporting to track code coverage
 * 4. Set up CI/CD pipeline integration for automated test runs
 */

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

// Constants from service configuration
const DRILL_CACHE_TTL = 300;
const MAX_CONCURRENT_ATTEMPTS = 3;

describe('DrillService', () => {
  let drillService: DrillService;
  let mockDb: any;
  let mockCache: any;

  // Sample test data
  const testDrill: DrillPrompt = {
    id: 'test-drill-1',
    type: DrillType.CASE_PROMPT,
    difficulty: DrillDifficulty.INTERMEDIATE,
    content: 'Test drill content',
    timeLimit: 30,
    industry: 'Technology'
  };

  const testAttempt: DrillAttempt = {
    id: 'test-attempt-1',
    userId: 'test-user-1',
    drillId: testDrill.id,
    status: DrillStatus.NOT_STARTED,
    response: '',
    startedAt: new Date(),
    completedAt: null,
    timeSpent: 0
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mock database
    mockDb = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };
    (createClient as jest.Mock).mockReturnValue(mockDb);

    // Initialize mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };
    (Redis as jest.Mock).mockImplementation(() => mockCache);

    // Create service instance with mocks
    drillService = new DrillService(mockDb, mockCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Requirement: Practice Drills - Test drill retrieval functionality
  describe('getDrillById', () => {
    it('should return drill from cache if available', async () => {
      const cachedDrill = JSON.stringify(testDrill);
      mockCache.get.mockResolvedValue(cachedDrill);

      const start = Date.now();
      const result = await drillService.getDrillById(testDrill.id);
      const duration = Date.now() - start;

      expect(result).toEqual(testDrill);
      expect(mockCache.get).toHaveBeenCalledWith(`drill:${testDrill.id}`);
      expect(mockDb.from).not.toHaveBeenCalled();
      // Requirement: System Performance - Verify response time
      expect(duration).toBeLessThan(200);
    });

    it('should fetch drill from database and cache it when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDb.single.mockResolvedValue({ data: testDrill, error: null });

      const result = await drillService.getDrillById(testDrill.id);

      expect(result).toEqual(testDrill);
      expect(mockCache.set).toHaveBeenCalledWith(
        `drill:${testDrill.id}`,
        JSON.stringify(testDrill),
        'EX',
        DRILL_CACHE_TTL
      );
    });

    it('should throw error for invalid drill ID', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDb.single.mockResolvedValue({ data: null, error: new Error('Not found') });

      await expect(drillService.getDrillById('invalid-id'))
        .rejects
        .toThrow('Failed to fetch drill');
    });
  });

  // Requirement: Practice Drills - Test drill listing functionality
  describe('listDrills', () => {
    it('should list drills with filters', async () => {
      const drills = [testDrill];
      mockDb.select.mockResolvedValue({ data: drills, error: null });

      const result = await drillService.listDrills(
        DrillType.CASE_PROMPT,
        DrillDifficulty.INTERMEDIATE,
        { industry: 'Technology' }
      );

      expect(result).toEqual(drills);
      expect(mockDb.from).toHaveBeenCalledWith('drills');
      expect(mockDb.eq).toHaveBeenCalledWith('type', DrillType.CASE_PROMPT);
      expect(mockDb.eq).toHaveBeenCalledWith('difficulty', DrillDifficulty.INTERMEDIATE);
      expect(mockDb.eq).toHaveBeenCalledWith('industry', 'Technology');
    });

    it('should return empty array when no drills match filters', async () => {
      mockDb.select.mockResolvedValue({ data: [], error: null });

      const result = await drillService.listDrills();

      expect(result).toEqual([]);
    });
  });

  // Requirement: User Engagement - Test drill attempt functionality
  describe('startDrillAttempt', () => {
    it('should create new drill attempt', async () => {
      mockDb.single.mockResolvedValue({ data: testDrill, error: null });
      mockDb.select.mockResolvedValue({ count: 0 });

      const result = await drillService.startDrillAttempt(
        testAttempt.userId,
        testAttempt.drillId
      );

      expect(result).toBeInstanceOf(DrillAttemptModel);
      expect(result.userId).toBe(testAttempt.userId);
      expect(result.drillId).toBe(testAttempt.drillId);
      expect(result.status).toBe(DrillStatus.NOT_STARTED);
    });

    it('should throw error when concurrent attempt limit exceeded', async () => {
      mockDb.select.mockResolvedValue({ count: MAX_CONCURRENT_ATTEMPTS });

      await expect(drillService.startDrillAttempt(
        testAttempt.userId,
        testAttempt.drillId
      )).rejects.toThrow(`Maximum concurrent attempts (${MAX_CONCURRENT_ATTEMPTS}) exceeded`);
    });
  });

  // Requirement: Practice Drills - Test response submission and evaluation
  describe('submitDrillResponse', () => {
    const testResponse = 'Test drill response';
    const testEvaluation: DrillEvaluation = {
      attemptId: testAttempt.id,
      score: 85,
      feedback: 'Good work',
      strengths: ['Clear structure'],
      improvements: ['Add more detail'],
      evaluatedAt: new Date()
    };

    it('should submit and evaluate drill response', async () => {
      mockDb.single.mockResolvedValue({ 
        data: { ...testAttempt, status: DrillStatus.IN_PROGRESS }, 
        error: null 
      });

      const attemptModel = new DrillAttemptModel(testAttempt);
      jest.spyOn(attemptModel, 'complete').mockResolvedValue();

      const result = await drillService.submitDrillResponse(
        testAttempt.id,
        testResponse
      );

      expect(result).toBeDefined();
      expect(mockDb.from).toHaveBeenCalledWith('drill_attempts');
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.eq).toHaveBeenCalledWith('id', testAttempt.id);
    });

    it('should throw error for invalid attempt status', async () => {
      mockDb.single.mockResolvedValue({ 
        data: { ...testAttempt, status: DrillStatus.COMPLETED }, 
        error: null 
      });

      await expect(drillService.submitDrillResponse(
        testAttempt.id,
        testResponse
      )).rejects.toThrow('Invalid attempt status for submission');
    });
  });

  // Requirement: User Engagement - Test drill history functionality
  describe('getUserDrillHistory', () => {
    it('should retrieve user drill history with filters', async () => {
      const attempts = [testAttempt];
      mockDb.select.mockResolvedValue({ data: attempts, error: null });

      const filters = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        type: DrillType.CASE_PROMPT
      };

      const result = await drillService.getUserDrillHistory(
        testAttempt.userId,
        filters
      );

      expect(result).toEqual(attempts);
      expect(mockDb.from).toHaveBeenCalledWith('drill_attempts');
      expect(mockDb.select).toHaveBeenCalledWith('*, drills(*)');
      expect(mockDb.eq).toHaveBeenCalledWith('user_id', testAttempt.userId);
    });

    it('should return empty array when no history exists', async () => {
      mockDb.select.mockResolvedValue({ data: [], error: null });

      const result = await drillService.getUserDrillHistory(testAttempt.userId);

      expect(result).toEqual([]);
    });
  });
});