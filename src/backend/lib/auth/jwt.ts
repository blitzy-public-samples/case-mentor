// @package jsonwebtoken ^9.0.0
// @package cookie ^0.5.0

/**
 * Human Tasks:
 * 1. Generate RSA-256 key pair and store securely in environment variables
 * 2. Configure secure cookie settings in production environment
 * 3. Set up proper CORS configuration for cookie handling
 * 4. Review and adjust token expiry times based on security requirements
 * 5. Implement proper error monitoring for authentication failures
 */

import { sign, verify } from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { APIError, APIErrorCode } from '../../types/api';
import { User } from '../../types/user';
import { AUTH_CONSTANTS } from '../../config/constants';

// Requirement: Authentication and Authorization - JWT-based authentication with RSA-256 signing
const generateToken = (user: User): string => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.TOKEN_EXPIRY
    };

    // Sign token with RSA-256 private key
    return sign(payload, process.env.JWT_PRIVATE_KEY!, {
      algorithm: 'RS256',
      issuer: 'case-interview-platform',
      audience: 'cip-users'
    });
  } catch (error) {
    throw {
      code: APIErrorCode.AUTHENTICATION_ERROR,
      message: 'Failed to generate authentication token'
    } as APIError;
  }
};

// Requirement: Authentication and Authorization - Secure token validation
const verifyToken = (token: string): User | null => {
  try {
    // Verify token signature and expiration
    const decoded = verify(token, process.env.JWT_PUBLIC_KEY!, {
      algorithms: ['RS256'],
      issuer: 'case-interview-platform',
      audience: 'cip-users'
    }) as {
      id: string;
      email: string;
      subscriptionTier: User['subscriptionTier'];
    };

    return {
      id: decoded.id,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier
    } as User;
  } catch (error) {
    return null;
  }
};

// Requirement: Session Management - Secure cookie handling
const setAuthCookie = (token: string, response: any): void => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: AUTH_CONSTANTS.TOKEN_EXPIRY * 1000,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  };

  const serializedCookie = serialize(AUTH_CONSTANTS.COOKIE_NAME, token, cookieOptions);
  response.setHeader('Set-Cookie', serializedCookie);
};

// Requirement: Session Management - Cookie cleanup on logout
const clearAuthCookie = (response: any): void => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  };

  const serializedCookie = serialize(AUTH_CONSTANTS.COOKIE_NAME, '', cookieOptions);
  response.setHeader('Set-Cookie', serializedCookie);
};

// Requirement: Session Management - Rolling refresh mechanism
const refreshToken = (token: string): string | null => {
  try {
    const user = verifyToken(token);
    if (!user) return null;

    // Check if within refresh window
    const decoded = verify(token, process.env.JWT_PUBLIC_KEY!, {
      algorithms: ['RS256'],
      complete: true
    });
    
    const expiryTime = (decoded.payload as { exp: number }).exp * 1000;
    const refreshWindowStart = expiryTime - AUTH_CONSTANTS.REFRESH_WINDOW * 1000;

    if (Date.now() >= refreshWindowStart && Date.now() < expiryTime) {
      return generateToken(user);
    }

    return null;
  } catch (error) {
    return null;
  }
};

export {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  refreshToken
};