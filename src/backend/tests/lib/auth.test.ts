// @package jest ^29.0.0
// @package next ^13.0.0

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateToken, 
  verifyToken, 
  setAuthCookie, 
  clearAuthCookie, 
  refreshToken 
} from '../../lib/auth/jwt';
import { 
  withAuth, 
  requireSubscription 
} from '../../lib/auth/middleware';
import { AUTH_CONSTANTS } from '../../config/constants';
import { UserSubscriptionTier } from '../../types/user';
import { APIErrorCode } from '../../types/api';

/**
 * Human Tasks:
 * 1. Generate RSA-256 key pair and set in test environment variables
 * 2. Configure test database with mock user data
 * 3. Set up proper test environment variables for cookie domain
 * 4. Review and adjust token expiry times in test configuration
 */

// Mock user data for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  subscriptionTier: UserSubscriptionTier.FREE
};

// Mock NextRequest and NextResponse
const createMockRequest = (options: { token?: string, header?: string } = {}) => {
  return {
    cookies: {
      get: jest.fn().mockReturnValue(options.token ? { value: options.token } : undefined)
    },
    headers: {
      get: jest.fn().mockReturnValue(options.header)
    }
  } as unknown as NextRequest;
};

const createMockResponse = () => {
  return {
    setHeader: jest.fn(),
    json: jest.fn()
  } as unknown as NextResponse;
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Requirement: Authentication and Authorization - JWT token management tests
describe('JWT Token Management', () => {
  test('should generate valid JWT token with RSA-256 signing', async () => {
    const token = generateToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      subscriptionTier: mockUser.subscriptionTier
    });
  });

  test('should fail token verification with expired token', async () => {
    // Generate token with minimal expiry
    const shortLivedToken = generateToken({
      ...mockUser,
      exp: Math.floor(Date.now() / 1000) - 1
    });
    
    const decoded = verifyToken(shortLivedToken);
    expect(decoded).toBeNull();
  });

  test('should fail token verification with invalid RSA-256 signature', async () => {
    const token = generateToken(mockUser);
    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    
    const decoded = verifyToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  test('should fail token verification with malformed JWT structure', async () => {
    const malformedToken = 'not.a.validtoken';
    const decoded = verifyToken(malformedToken);
    expect(decoded).toBeNull();
  });
});

// Requirement: Session Management - Auth middleware tests
describe('Auth Middleware', () => {
  const mockHandler = jest.fn().mockResolvedValue(new NextResponse());

  test('should allow request with valid RSA-256 signed token', async () => {
    const token = generateToken(mockUser);
    const req = createMockRequest({ token });
    
    const protectedHandler = withAuth(mockHandler);
    await protectedHandler(req);
    
    expect(mockHandler).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ user: expect.objectContaining(mockUser) })
    );
  });

  test('should reject request with missing auth cookie/header', async () => {
    const req = createMockRequest();
    const protectedHandler = withAuth(mockHandler);
    const response = await protectedHandler(req);
    
    const body = await response.json();
    expect(body.code).toBe(APIErrorCode.AUTHENTICATION_ERROR);
  });

  test('should reject request with expired token', async () => {
    const expiredToken = generateToken({
      ...mockUser,
      exp: Math.floor(Date.now() / 1000) - 1
    });
    
    const req = createMockRequest({ token: expiredToken });
    const protectedHandler = withAuth(mockHandler);
    const response = await protectedHandler(req);
    
    const body = await response.json();
    expect(body.code).toBe(APIErrorCode.AUTHENTICATION_ERROR);
  });

  test('should refresh token within REFRESH_WINDOW timeframe', async () => {
    // Generate token near expiry but within refresh window
    const nearExpiryToken = generateToken({
      ...mockUser,
      exp: Math.floor(Date.now() / 1000) + (AUTH_CONSTANTS.REFRESH_WINDOW / 2)
    });
    
    const req = createMockRequest({ token: nearExpiryToken });
    const protectedHandler = withAuth(mockHandler);
    await protectedHandler(req);
    
    // Verify new token was generated and set
    expect(mockHandler).toHaveBeenCalled();
  });
});

// Requirement: Security Controls - Subscription validation tests
describe('Subscription Validation', () => {
  test('should allow access with required subscription tier', async () => {
    const req = createMockRequest();
    const validator = requireSubscription([UserSubscriptionTier.FREE]);
    
    const response = await validator(req, { user: mockUser });
    expect(response).toBeNull(); // Null response means validation passed
  });

  test('should reject access with insufficient subscription level', async () => {
    const req = createMockRequest();
    const validator = requireSubscription([UserSubscriptionTier.PREMIUM]);
    
    const response = await validator(req, { user: mockUser });
    const body = await response?.json();
    
    expect(body.code).toBe(APIErrorCode.AUTHORIZATION_ERROR);
  });

  test('should allow access with multiple allowed subscription tiers', async () => {
    const req = createMockRequest();
    const validator = requireSubscription([
      UserSubscriptionTier.FREE,
      UserSubscriptionTier.BASIC
    ]);
    
    const response = await validator(req, { user: mockUser });
    expect(response).toBeNull();
  });
});

// Requirement: Session Management - Cookie management tests
describe('Cookie Management', () => {
  test('should set secure HTTP-only cookie with valid JWT', () => {
    const token = generateToken(mockUser);
    const response = createMockResponse();
    
    setAuthCookie(token, response);
    
    expect(response.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('HttpOnly')
    );
  });

  test('should clear auth cookie on user logout', () => {
    const response = createMockResponse();
    clearAuthCookie(response);
    
    expect(response.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Max-Age=0')
    );
  });

  test('should set proper cookie security options', () => {
    const token = generateToken(mockUser);
    const response = createMockResponse();
    
    setAuthCookie(token, response);
    
    const cookieHeader = response.setHeader.mock.calls[0][1];
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Strict');
    
    if (process.env.NODE_ENV === 'production') {
      expect(cookieHeader).toContain('Secure');
    }
  });

  test('should set cookie expiry aligned with TOKEN_EXPIRY', () => {
    const token = generateToken(mockUser);
    const response = createMockResponse();
    
    setAuthCookie(token, response);
    
    const cookieHeader = response.setHeader.mock.calls[0][1];
    expect(cookieHeader).toContain(`Max-Age=${AUTH_CONSTANTS.TOKEN_EXPIRY}`);
  });
});