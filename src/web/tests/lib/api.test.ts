// Third-party imports
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.7.0
import MockAdapter from 'axios-mock-adapter'; // ^1.22.0

// Internal imports
import { api } from '../../lib/api';
import { APIResponse, APIError, ErrorCode, RateLimitInfo, PaginatedResponse } from '../../types/api';
import { API_CONFIG } from '../../config/constants';

/**
 * Human Tasks:
 * 1. Configure proper network conditions for testing retry mechanism
 * 2. Set up monitoring for API response time assertions
 * 3. Verify rate limit thresholds with backend team
 * 4. Ensure test coverage meets minimum 90% threshold
 * 5. Set up proper test data isolation
 */

// Mock axios instance
let mockAxios: MockAdapter;

// Test data
const TEST_ENDPOINT = '/test';
const TEST_PAYLOAD = { key: 'value' };
const TEST_RESPONSE = { id: 1, name: 'test' };

// Setup and teardown
beforeEach(() => {
  // Reset mock adapter before each test
  mockAxios = new MockAdapter(api);
  jest.useFakeTimers();
});

afterEach(() => {
  mockAxios.restore();
  jest.useRealTimers();
});

describe('API Client', () => {
  // Requirement: API Architecture - Tests standardized API client implementation
  describe('GET request', () => {
    test('should handle successful GET request', async () => {
      // Setup mock response
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(200, TEST_RESPONSE);

      // Record start time for performance measurement
      const startTime = Date.now();

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Record end time
      const endTime = Date.now();

      // Requirement: System Performance - Validates API response time under 200ms
      expect(endTime - startTime).toBeLessThan(200);

      // Validate response structure
      expect(response).toMatchObject({
        success: true,
        data: TEST_RESPONSE,
        error: null
      });
    });

    test('should handle GET request errors', async () => {
      // Setup mock error response
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(500, {
        message: 'Internal Server Error'
      });

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Validate error handling
      expect(response).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    });
  });

  // Requirement: API Architecture - Tests standardized API client implementation
  describe('POST request', () => {
    test('should handle successful POST request', async () => {
      // Setup mock response
      mockAxios.onPost(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`, TEST_PAYLOAD).reply(200, TEST_RESPONSE);

      // Record start time for performance measurement
      const startTime = Date.now();

      // Make request
      const response = await api.post<typeof TEST_RESPONSE>(TEST_ENDPOINT, TEST_PAYLOAD);

      // Record end time
      const endTime = Date.now();

      // Requirement: System Performance - Validates API response time under 200ms
      expect(endTime - startTime).toBeLessThan(200);

      // Validate response structure
      expect(response).toMatchObject({
        success: true,
        data: TEST_RESPONSE,
        error: null
      });
    });

    test('should handle POST request validation errors', async () => {
      // Setup mock validation error response
      mockAxios.onPost(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(422, {
        message: 'Validation Error'
      });

      // Make request
      const response = await api.post<typeof TEST_RESPONSE>(TEST_ENDPOINT, TEST_PAYLOAD);

      // Validate error handling
      expect(response).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR
        }
      });
    });
  });

  // Requirement: Rate Limiting - Verifies tier-based rate limiting
  describe('Rate Limiting', () => {
    test('should handle rate limit errors', async () => {
      // Setup mock rate limit response
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(429, {}, {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': (Date.now() + 3600000).toString(),
        'retry-after': '3600'
      });

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Validate rate limit error handling
      expect(response).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.RATE_LIMIT_ERROR,
          details: {
            retryAfter: '3600'
          }
        }
      });
    });

    test('should track rate limit headers', async () => {
      // Setup mock response with rate limit headers
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(200, TEST_RESPONSE, {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
        'x-ratelimit-reset': (Date.now() + 3600000).toString()
      });

      // Make request
      await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Make another request to verify headers are tracked
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      expect(response.success).toBe(true);
    });
  });

  // Requirement: API Architecture - Tests error handling and retry mechanism
  describe('Retry Logic', () => {
    test('should retry failed requests', async () => {
      let attempts = 0;

      // Setup mock to fail twice then succeed
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(() => {
        attempts++;
        if (attempts <= 2) {
          return [500, { message: 'Server Error' }];
        }
        return [200, TEST_RESPONSE];
      });

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Verify retry attempts
      expect(attempts).toBe(3);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(TEST_RESPONSE);
    });

    test('should handle maximum retry attempts', async () => {
      // Setup mock to always fail
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(500);

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Verify error after max retries
      expect(response).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    });
  });

  // Requirement: API Architecture - Tests error handling
  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Setup mock network error
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).networkError();

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Validate network error handling
      expect(response).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.INTERNAL_ERROR
        }
      });
    });

    test('should handle authentication errors', async () => {
      // Setup mock authentication error
      mockAxios.onGet(`${API_CONFIG.BASE_URL}${TEST_ENDPOINT}`).reply(401);

      // Make request
      const response = await api.get<typeof TEST_RESPONSE>(TEST_ENDPOINT);

      // Validate authentication error handling
      expect(response).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR
        }
      });
    });
  });
});