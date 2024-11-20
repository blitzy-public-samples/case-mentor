// @package jest ^29.0.0

/**
 * Human Tasks:
 * 1. Configure test database with proper test data
 * 2. Set up monitoring for failed authentication attempts in production
 * 3. Configure proper error tracking for API failures
 * 4. Review and adjust rate limits based on actual usage patterns
 */

import { describe, it, expect, beforeEach, jest } from 'jest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../../api/users/route';
import { UserService } from '../../services/UserService';
import { User, UserProfile, UserSubscriptionTier, UserSubscriptionStatus } from '../../types/user';

// Mock UserService
jest.mock('../../services/UserService');

// Requirement: User Management - Test data setup
const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    targetFirm: 'McKinsey',
    interviewDate: new Date('2024-03-01'),
    preparationLevel: 'INTERMEDIATE',
    avatarUrl: 'https://example.com/avatar.jpg'
  },
  subscriptionTier: UserSubscriptionTier.BASIC,
  subscriptionStatus: UserSubscriptionStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date()
};

// Requirement: User Management - Helper function for creating mock requests
const createMockRequest = (options: { 
  method: string; 
  headers?: Record<string, string>; 
  body?: any 
}): NextRequest => {
  const { method, headers = {}, body } = options;
  
  const request = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers
    }),
    cookies: {
      get: jest.fn().mockReturnValue({ value: 'mock-token' })
    },
    json: jest.fn().mockResolvedValue(body)
  } as unknown as NextRequest;

  return request;
};

describe('User API Endpoints', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default UserService mock implementations
    (UserService as jest.MockedClass<typeof UserService>).prototype.registerUser.mockResolvedValue(mockUser);
    (UserService as jest.MockedClass<typeof UserService>).prototype.authenticateUser.mockResolvedValue(mockUser);
    (UserService as jest.MockedClass<typeof UserService>).prototype.updateProfile.mockResolvedValue(mockUser);
    (UserService as jest.MockedClass<typeof UserService>).prototype.getUserProgress.mockResolvedValue({
      userId: mockUser.id,
      drillsCompleted: 10,
      drillsSuccessRate: 85,
      simulationsCompleted: 5,
      simulationsSuccessRate: 90,
      skillLevels: {
        'market-sizing': 80,
        'case-math': 85,
        'synthesis': 75
      },
      lastUpdated: new Date()
    });
  });

  // Requirement: User Management - Profile customization, progress tracking
  describe('GET /api/users', () => {
    it('should return user profile and progress when authenticated with valid token', async () => {
      const request = createMockRequest({ 
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await GET(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('userId', mockUser.id);
      expect(data.data).toHaveProperty('drillsCompleted');
      expect(data.data).toHaveProperty('skillLevels');
    });

    it('should return 401 when authentication token is missing or invalid', async () => {
      const request = createMockRequest({ 
        method: 'GET',
        headers: {} 
      });

      const response = await GET(request, { user: null });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it("should return 403 when subscription tier doesn't allow access", async () => {
      const request = createMockRequest({ 
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      (UserService as jest.MockedClass<typeof UserService>).prototype.getUserProgress
        .mockRejectedValue(new Error('Usage limit exceeded or invalid subscription'));

      const response = await GET(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should return 500 on UserService error', async () => {
      const request = createMockRequest({ 
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      (UserService as jest.MockedClass<typeof UserService>).prototype.getUserProgress
        .mockRejectedValue(new Error('Internal server error'));

      const response = await GET(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  // Requirement: User Management - Profile customization
  describe('POST /api/users', () => {
    const validRegistrationData = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
        targetFirm: 'BCG',
        interviewDate: '2024-04-01',
        preparationLevel: 'BEGINNER',
        avatarUrl: null
      }
    };

    it('should create new user with valid registration data', async () => {
      const request = createMockRequest({ 
        method: 'POST',
        body: validRegistrationData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('email', validRegistrationData.email);
      expect(data.data.profile).toMatchObject(validRegistrationData.profile);
    });

    it('should return 400 with invalid or missing registration fields', async () => {
      const request = createMockRequest({ 
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: '123',
          profile: {}
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 if email already exists', async () => {
      const request = createMockRequest({ 
        method: 'POST',
        body: validRegistrationData
      });

      (UserService as jest.MockedClass<typeof UserService>).prototype.registerUser
        .mockRejectedValue(new Error('Email already exists'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 on UserService registration error', async () => {
      const request = createMockRequest({ 
        method: 'POST',
        body: validRegistrationData
      });

      (UserService as jest.MockedClass<typeof UserService>).prototype.registerUser
        .mockRejectedValue(new Error('Database connection failed'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  // Requirement: User Management - Profile customization
  describe('PUT /api/users', () => {
    const validProfileData = {
      profile: {
        firstName: 'John',
        lastName: 'Updated',
        targetFirm: 'Bain',
        interviewDate: '2024-05-01',
        preparationLevel: 'ADVANCED',
        avatarUrl: 'https://example.com/new-avatar.jpg'
      }
    };

    it('should update user profile with valid profile data when authenticated', async () => {
      const request = createMockRequest({ 
        method: 'PUT',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: validProfileData
      });

      const response = await PUT(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.profile).toMatchObject(validProfileData.profile);
    });

    it('should return 401 when authentication token is missing or invalid', async () => {
      const request = createMockRequest({ 
        method: 'PUT',
        body: validProfileData
      });

      const response = await PUT(request, { user: null });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 400 with invalid profile update data', async () => {
      const request = createMockRequest({ 
        method: 'PUT',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: {
          profile: {
            firstName: '',
            preparationLevel: 'INVALID'
          }
        }
      });

      const response = await PUT(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it("should return 403 when subscription tier doesn't allow updates", async () => {
      const request = createMockRequest({ 
        method: 'PUT',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: validProfileData
      });

      (UserService as jest.MockedClass<typeof UserService>).prototype.updateProfile
        .mockRejectedValue(new Error('Subscription tier not sufficient'));

      const response = await PUT(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should return 500 on UserService update error', async () => {
      const request = createMockRequest({ 
        method: 'PUT',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: validProfileData
      });

      (UserService as jest.MockedClass<typeof UserService>).prototype.updateProfile
        .mockRejectedValue(new Error('Database error'));

      const response = await PUT(request, { user: { id: mockUser.id } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});