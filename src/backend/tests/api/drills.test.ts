// @package jest ^29.0.0
// @package next ^13.0.0

import { describe, expect, jest, beforeEach, test } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT } from '../../api/drills/route';
import { withAuth } from '../../lib/auth/middleware';
import { DrillService } from '../../services/DrillService';
import { 
  DrillType, 
  DrillPrompt, 
  DrillAttempt, 
  DrillResponse, 
  DrillDifficulty, 
  DrillStatus, 
  DrillEvaluation 
} from '../../types/drills';

// Mock dependencies
jest.mock('../../lib/auth/middleware');
jest.mock('../../services/DrillService');

// Mock authenticated user
const mockUser = {
  id: '123',
  email: 'test@example.com',
  subscriptionTier: 'PREMIUM'
};

// Mock drill service responses
const mockDrills: DrillPrompt[] = [
  {
    id: '1',
    type: DrillType.CASE_PROMPT,
    difficulty: DrillDifficulty.INTERMEDIATE,
    content: 'Test drill content',
    timeLimit: 30,
    industry: 'Technology'
  }
];

const mockAttempt: DrillAttempt = {
  id: '1',
  userId: mockUser.id,
  drillId: '1',
  status: DrillStatus.IN_PROGRESS,
  response: '',
  startedAt: new Date(),
  completedAt: null,
  timeSpent: 0
};

const mockEvaluation: DrillEvaluation = {
  attemptId: '1',
  score: 85,
  feedback: 'Good work!',
  strengths: ['Clear structure'],
  improvements: ['Add more details'],
  evaluatedAt: new Date()
};

describe('Drill API Endpoints', () => {
  let mockDrillService: jest.Mocked<DrillService>;
  let mockWithAuth: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DrillService methods
    mockDrillService = {
      listDrills: jest.fn().mockResolvedValue(mockDrills),
      startDrillAttempt: jest.fn().mockResolvedValue(mockAttempt),
      submitDrillResponse: jest.fn().mockResolvedValue(mockEvaluation)
    } as any;

    // Mock auth middleware to pass authentication
    mockWithAuth = withAuth as jest.Mock;
    mockWithAuth.mockImplementation((handler) => async (req: NextRequest) => {
      return handler(req, { user: mockUser });
    });

    // Reset DrillService constructor mock
    (DrillService as jest.Mock).mockImplementation(() => mockDrillService);
  });

  // Requirement: Practice Drills - Test drill listing endpoint
  describe('GET /api/drills', () => {
    test('should return filtered drills list successfully', async () => {
      // Requirement: System Performance - Test response time
      const startTime = Date.now();

      const url = new URL('http://localhost/api/drills');
      url.searchParams.set('type', DrillType.CASE_PROMPT);
      url.searchParams.set('difficulty', DrillDifficulty.INTERMEDIATE);
      url.searchParams.set('industry', 'Technology');
      
      const request = new NextRequest('GET', url);
      const response = await GET(request, { user: mockUser });
      const data = await response.json();

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Verify service call
      expect(mockDrillService.listDrills).toHaveBeenCalledWith(
        DrillType.CASE_PROMPT,
        DrillDifficulty.INTERMEDIATE,
        expect.objectContaining({
          industry: 'Technology',
          page: 1,
          pageSize: 20
        })
      );

      // Requirement: System Performance - Verify response time under 200ms
      expect(Date.now() - startTime).toBeLessThan(200);
    });

    test('should handle invalid query parameters', async () => {
      const url = new URL('http://localhost/api/drills');
      url.searchParams.set('type', 'INVALID_TYPE');
      
      const request = new NextRequest('GET', url);
      const response = await GET(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    test('should handle authentication failure', async () => {
      mockWithAuth.mockImplementation(() => {
        throw new Error('Authentication failed');
      });

      const request = new NextRequest('GET', 'http://localhost/api/drills');
      const response = await GET(request, { user: null });

      expect(response.status).toBe(401);
    });
  });

  // Requirement: Practice Drills - Test drill attempt creation
  describe('POST /api/drills', () => {
    test('should create drill attempt successfully', async () => {
      const request = new NextRequest('POST', 'http://localhost/api/drills', {
        body: JSON.stringify({ drillId: '1' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockAttempt);

      expect(mockDrillService.startDrillAttempt).toHaveBeenCalledWith(
        mockUser.id,
        '1'
      );
    });

    test('should handle invalid drill ID', async () => {
      mockDrillService.startDrillAttempt.mockRejectedValue(
        new Error('Invalid drill ID')
      );

      const request = new NextRequest('POST', 'http://localhost/api/drills', {
        body: JSON.stringify({ drillId: 'invalid-id' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    // Requirement: User Engagement - Test completion rate tracking
    test('should handle concurrent attempt limit', async () => {
      mockDrillService.startDrillAttempt.mockRejectedValue(
        new Error('Maximum concurrent attempts exceeded')
      );

      const request = new NextRequest('POST', 'http://localhost/api/drills', {
        body: JSON.stringify({ drillId: '1' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Failed to start drill attempt');
    });
  });

  // Requirement: Practice Drills - Test drill response submission
  describe('PUT /api/drills', () => {
    test('should submit and evaluate drill response successfully', async () => {
      const request = new NextRequest('PUT', 'http://localhost/api/drills', {
        body: JSON.stringify({
          attemptId: '1',
          response: 'Test response content'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEvaluation);

      expect(mockDrillService.submitDrillResponse).toHaveBeenCalledWith(
        '1',
        'Test response content'
      );
    });

    test('should handle invalid attempt ID', async () => {
      mockDrillService.submitDrillResponse.mockRejectedValue(
        new Error('Invalid attempt ID')
      );

      const request = new NextRequest('PUT', 'http://localhost/api/drills', {
        body: JSON.stringify({
          attemptId: 'invalid-id',
          response: 'Test response'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    test('should handle response validation failure', async () => {
      const request = new NextRequest('PUT', 'http://localhost/api/drills', {
        body: JSON.stringify({
          attemptId: '1',
          response: '' // Empty response should fail validation
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Invalid request body');
    });

    // Requirement: System Performance - Test timeout handling
    test('should handle evaluation timeout', async () => {
      mockDrillService.submitDrillResponse.mockRejectedValue(
        new Error('Evaluation timeout')
      );

      const request = new NextRequest('PUT', 'http://localhost/api/drills', {
        body: JSON.stringify({
          attemptId: '1',
          response: 'Test response'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { user: mockUser });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Failed to submit drill response');
    });
  });
});