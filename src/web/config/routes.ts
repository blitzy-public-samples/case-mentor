// @ts-check

/**
 * Human Tasks:
 * 1. Verify route access patterns with security team
 * 2. Configure proper CORS settings for API routes
 * 3. Set up proper rate limiting rules per subscription tier
 * 4. Ensure proper error handling for auth redirects
 * 5. Implement proper CSP headers for protected routes
 */

// Internal imports
import { AuthState } from '../types/auth';
import { APIResponse } from '../types/api';

// Requirement: Core Features - Route definitions for practice drills and McKinsey simulation
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/verify'
] as const;

// Requirement: Core Features - Protected route paths requiring authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/drills',
  '/simulation',
  '/profile',
  '/progress',
  '/settings',
  '/subscription'
] as const;

// Requirement: Authentication & Authorization - Authentication-specific routes
export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/reset-password',
  '/verify'
] as const;

// Requirement: Authentication & Authorization - Route-based access control validation
export const isProtectedRoute = (path: string): boolean => {
  // Check if path starts with dashboard prefix
  if (path.startsWith('/dashboard')) {
    return true;
  }

  // Check if path exists in protected routes list
  return PROTECTED_ROUTES.includes(path as typeof PROTECTED_ROUTES[number]);
};

// Requirement: Authentication & Authorization - Route redirection logic based on auth state
export const getRedirectPath = (authState: AuthState, currentPath: string): string | null => {
  // Check if current path requires authentication
  const requiresAuth = isProtectedRoute(currentPath);

  // Redirect to login if protected route accessed without authentication
  if (requiresAuth && !authState.authenticated) {
    return '/login';
  }

  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.includes(currentPath as typeof AUTH_ROUTES[number]);

  // Redirect to dashboard if authenticated user tries to access auth routes
  if (isAuthRoute && authState.authenticated) {
    return '/dashboard';
  }

  // No redirect needed
  return null;
};

// Requirement: Core Features - Route configuration with access control settings
export const routes = {
  // Public routes accessible without authentication
  public: [
    {
      path: '/',
      exact: true,
      auth: false
    },
    {
      path: '/login',
      exact: true,
      auth: false
    },
    {
      path: '/register',
      exact: true,
      auth: false
    },
    {
      path: '/reset-password',
      exact: true,
      auth: false
    },
    {
      path: '/verify',
      exact: true,
      auth: false
    }
  ],

  // Authentication-specific routes
  auth: [
    {
      path: '/login',
      exact: true,
      auth: false,
      redirectAuthenticated: '/dashboard'
    },
    {
      path: '/register',
      exact: true,
      auth: false,
      redirectAuthenticated: '/dashboard'
    },
    {
      path: '/reset-password',
      exact: true,
      auth: false,
      redirectAuthenticated: '/dashboard'
    },
    {
      path: '/verify',
      exact: true,
      auth: false,
      redirectAuthenticated: '/dashboard'
    }
  ],

  // Protected dashboard routes requiring authentication
  dashboard: [
    {
      path: '/dashboard',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    },
    {
      path: '/drills',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    },
    {
      path: '/simulation',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    },
    {
      path: '/profile',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    },
    {
      path: '/progress',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    },
    {
      path: '/settings',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    },
    {
      path: '/subscription',
      exact: true,
      auth: true,
      redirectUnauthenticated: '/login'
    }
  ]
};