// @package next ^13.0.0

/**
 * Human Tasks:
 * 1. Configure rate limiting middleware with Redis for distributed rate limiting
 * 2. Set up proper CORS configuration for API routes
 * 3. Implement request logging and monitoring for authentication failures
 * 4. Review and adjust token refresh window based on security requirements
 * 5. Set up proper error tracking for authentication issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, refreshToken, setAuthCookie } from './jwt';
import { APIError, APIErrorCode } from '../../types/api';
import { User, UserSubscriptionTier } from '../../types/user';

// Requirement: Authentication and Authorization - JWT token extraction and validation
const extractToken = (req: NextRequest): string | null => {
  // Try to get token from cookie first
  const token = req.cookies.get('cip_session')?.value;
  if (token) return token;

  // Fallback to Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

// Requirement: Authentication and Authorization - JWT-based authentication with secure session management
export const withAuth = (
  handler: (req: NextRequest, context: { user: User }) => Promise<NextResponse>,
  options: { requireAuth?: boolean } = { requireAuth: true }
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const token = extractToken(req);

      // Handle optional authentication
      if (!token && !options.requireAuth) {
        return handler(req, { user: null as any });
      }

      // Require token if authentication is required
      if (!token && options.requireAuth) {
        throw {
          code: APIErrorCode.AUTHENTICATION_ERROR,
          message: 'Authentication required',
          details: {},
          timestamp: new Date().toISOString(),
          requestId: req.headers.get('x-request-id') || crypto.randomUUID()
        } as APIError;
      }

      // Verify the token
      const user = verifyToken(token!);
      if (!user) {
        throw {
          code: APIErrorCode.AUTHENTICATION_ERROR,
          message: 'Invalid authentication token',
          details: {},
          timestamp: new Date().toISOString(),
          requestId: req.headers.get('x-request-id') || crypto.randomUUID()
        } as APIError;
      }

      // Check if token needs refresh
      const newToken = refreshToken(token!);
      let response = await handler(req, { user });

      // Set new token if refreshed
      if (newToken) {
        setAuthCookie(newToken, response);
      }

      return response;

    } catch (error) {
      if ((error as APIError).code) {
        return NextResponse.json(error, { status: 401 });
      }

      return NextResponse.json({
        code: APIErrorCode.AUTHENTICATION_ERROR,
        message: 'Authentication failed',
        details: {},
        timestamp: new Date().toISOString(),
        requestId: req.headers.get('x-request-id') || crypto.randomUUID()
      } as APIError, { status: 401 });
    }
  };
};

// Requirement: Security Controls - Role-based access control with subscription tier validation
export const requireSubscription = (requiredTiers: UserSubscriptionTier[]) => {
  return async (req: NextRequest, context: { user: User }): Promise<NextResponse | null> => {
    try {
      const { user } = context;

      if (!requiredTiers.includes(user.subscriptionTier)) {
        throw {
          code: APIErrorCode.AUTHORIZATION_ERROR,
          message: 'Subscription tier not sufficient for this resource',
          details: {
            currentTier: user.subscriptionTier,
            requiredTiers
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers.get('x-request-id') || crypto.randomUUID()
        } as APIError;
      }

      return null; // Allow request to proceed

    } catch (error) {
      if ((error as APIError).code) {
        return NextResponse.json(error, { status: 403 });
      }

      return NextResponse.json({
        code: APIErrorCode.AUTHORIZATION_ERROR,
        message: 'Authorization failed',
        details: {},
        timestamp: new Date().toISOString(),
        requestId: req.headers.get('x-request-id') || crypto.randomUUID()
      } as APIError, { status: 403 });
    }
  };
};