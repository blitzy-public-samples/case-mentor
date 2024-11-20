// @package jest ^29.0.0

/**
 * Human Tasks:
 * 1. Configure test database with proper test data seeding
 * 2. Set up test environment variables for authentication
 * 3. Configure test coverage reporting thresholds
 * 4. Set up integration test monitoring in CI/CD pipeline
 */

import { GET, POST, PATCH } from '../../api/feedback/route';
import { FeedbackService } from '../../services/FeedbackService';
import { APIError } from '../../lib/errors/APIError';
import { jest } from '@jest/globals';

// Mock FeedbackService
jest.mock('../../services/FeedbackService');

// Mock feedback data for testing
const mockFeedbackData = {
  id: 'test-feedback-id',
  attemptId: 'test-attempt-id',
  type: 'drill',
  score: 85,
  feedback: 'Test feedback content',
  createdAt: '2024-01-01T00:00:00Z'
};

// Helper function to create mock requests
const createMockRequest = (config: {
  method: string;
  headers?: Record<string, string>;
  body?: any;
  searchParams?: Record<string, string>;
}) => {
  const headers = new Headers(config.headers || {
    'authorization': 'Bearer test-token'
  });

  const url = new URL('http://localhost/api/feedback');
  if (config.searchParams) {
    Object.entries(config.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    method: config.method,
    headers,
    url: url.toString(),
    json: async () => config.body
  };
};

describe('Feedback API Endpoints', () => {
  let mockFeedbackService: jest.Mocked<FeedbackService>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Initialize mock FeedbackService
    mockFeedbackService = {
      generateFeedback: jest.fn(),
      getFeedback: jest.fn(),
      getAttemptFeedback: jest.fn(),
      updateFeedback: jest.fn()
    } as any;

    // Mock successful responses
    mockFeedbackService.generateFeedback.mockResolvedValue(mockFeedbackData);
    mockFeedbackService.getFeedback.mockResolvedValue(mockFeedbackData);
    mockFeedbackService.getAttemptFeedback.mockResolvedValue([mockFeedbackData]);
    mockFeedbackService.updateFeedback.mockResolvedValue(undefined);
  });

  describe('GET /api/feedback', () => {
    // Requirement: AI Evaluation - Feedback retrieval with caching
    it('should return feedback by ID', async () => {
      const request = createMockRequest({
        method: 'GET',
        searchParams: { feedbackId: 'test-feedback-id' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockFeedbackData });
      expect(mockFeedbackService.getFeedback).toHaveBeenCalledWith('test-feedback-id');
    });

    // Requirement: Progress Tracking - Performance analytics
    it('should return feedback by attempt ID', async () => {
      const request = createMockRequest({
        method: 'GET',
        searchParams: { attemptId: 'test-attempt-id' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: [mockFeedbackData] });
      expect(mockFeedbackService.getAttemptFeedback).toHaveBeenCalledWith('test-attempt-id');
    });

    it('should handle not found errors', async () => {
      mockFeedbackService.getFeedback.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        searchParams: { feedbackId: 'non-existent-id' }
      });

      const response = await GET(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle missing query parameters', async () => {
      const request = createMockRequest({
        method: 'GET'
      });

      const response = await GET(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/feedback', () => {
    // Requirement: AI Evaluation - Consistent, objective feedback generation
    it('should generate new feedback', async () => {
      const requestBody = {
        attemptId: 'test-attempt-id',
        type: 'DRILL',
        response: {
          content: 'Test response',
          metrics: [{ name: 'accuracy', value: 85 }]
        }
      };

      const request = createMockRequest({
        method: 'POST',
        body: requestBody
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockFeedbackData });
      expect(mockFeedbackService.generateFeedback).toHaveBeenCalledWith(
        requestBody.attemptId,
        requestBody.type,
        requestBody.response
      );
    });

    it('should validate request payload', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { invalidData: true }
      });

      const response = await POST(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle AI service errors', async () => {
      mockFeedbackService.generateFeedback.mockRejectedValue(
        new APIError('INTERNAL_ERROR', 'AI service failed')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          attemptId: 'test-attempt-id',
          type: 'DRILL',
          response: {
            content: 'Test response',
            metrics: [{ name: 'accuracy', value: 85 }]
          }
        }
      });

      const response = await POST(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('PATCH /api/feedback', () => {
    // Requirement: Progress Tracking - Feedback maintenance
    it('should update existing feedback', async () => {
      const updateData = {
        content: {
          summary: 'Updated summary',
          strengths: ['strength1'],
          improvements: ['improvement1'],
          recommendations: ['recommendation1']
        }
      };

      const request = createMockRequest({
        method: 'PATCH',
        searchParams: { feedbackId: 'test-feedback-id' },
        body: updateData
      });

      mockFeedbackService.getFeedback.mockResolvedValue({
        ...mockFeedbackData,
        ...updateData
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toMatchObject(updateData);
      expect(mockFeedbackService.updateFeedback).toHaveBeenCalledWith(
        'test-feedback-id',
        updateData
      );
    });

    it('should validate update data', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        searchParams: { feedbackId: 'test-feedback-id' },
        body: { invalidData: true }
      });

      const response = await PATCH(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle not found errors', async () => {
      mockFeedbackService.updateFeedback.mockRejectedValue(
        new APIError('NOT_FOUND', 'Feedback not found')
      );

      const request = createMockRequest({
        method: 'PATCH',
        searchParams: { feedbackId: 'non-existent-id' },
        body: {
          content: {
            summary: 'Updated summary',
            strengths: ['strength1'],
            improvements: ['improvement1'],
            recommendations: ['recommendation1']
          }
        }
      });

      const response = await PATCH(request);
      const error = await response.json();

      expect(response.status).toBe(400);
      expect(error.code).toBe('NOT_FOUND');
    });
  });
});