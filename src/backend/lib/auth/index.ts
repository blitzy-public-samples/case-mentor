/**
 * Human Tasks:
 * 1. Generate RSA-256 key pair and store in environment variables as JWT_PRIVATE_KEY and JWT_PUBLIC_KEY
 * 2. Configure secure cookie settings in production environment
 * 3. Set up proper CORS configuration for cookie handling across domains
 * 4. Review and adjust token expiry times based on security requirements
 * 5. Implement proper error monitoring for authentication failures
 */

// Re-export authentication utilities and middleware
// Requirement: Authentication and Authorization - JWT-based authentication with RSA-256 signing
import {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  refreshToken
} from './jwt';

// Requirement: Security Controls - Authentication middleware with JWT validation
import {
  withAuth,
  requireSubscription
} from './middleware';

export {
  // JWT token management functions
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  refreshToken,
  
  // Authentication middleware
  withAuth,
  requireSubscription
};