// @ts-check

/**
 * Human Tasks:
 * 1. Verify JWT token expiration settings with security requirements
 * 2. Configure Supabase authentication providers in project dashboard
 * 3. Set up proper CORS and CSP headers for OAuth providers
 * 4. Implement proper token storage mechanism in production
 * 5. Configure rate limiting for authentication endpoints
 */

// Internal imports
import { APIResponse, APIError } from './api';
import { UserProfile, UserSubscriptionTier, User } from './user';

// Third-party imports
import { Session, User as SupabaseUser, Provider } from '@supabase/supabase-js'; // ^2.0.0

// Requirement: Authentication & Authorization - Credentials interface for login/registration
export interface AuthCredentials {
  email: string;
  password: string;
}

// Requirement: Authentication & Authorization - Session management with JWT tokens
export interface AuthSession {
  user: User;
  session: Session;
  profile: UserProfile;
  expiresAt: number; // Unix timestamp for JWT expiration
}

// Requirement: Authentication & Authorization - Frontend auth state management
export interface AuthState {
  initialized: boolean; // Whether auth system has been initialized
  loading: boolean; // Loading state for auth operations
  authenticated: boolean; // Current authentication status
  session: AuthSession | null; // Active session data
  user: User | null; // Currently authenticated user
}

// Requirement: Security Controls - Type alias for auth API responses
export type AuthResponse = APIResponse<AuthSession>;

// Requirement: Authentication & Authorization - Supported authentication providers
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github'
}

// Requirement: Security Controls - Password reset request interface
export interface PasswordResetRequest {
  email: string;
}

// Requirement: Security Controls - Password update with reset token
export interface PasswordUpdateRequest {
  token: string; // JWT reset token
  newPassword: string;
}

// Additional type guards and utility types for auth operations
export type AuthError = APIError & {
  code: 'INVALID_CREDENTIALS' | 'SESSION_EXPIRED' | 'INVALID_TOKEN' | 'UNAUTHORIZED';
};

// Requirement: Authentication & Authorization - OAuth response handling
export interface OAuthResponse {
  provider: AuthProvider;
  accessToken: string;
  refreshToken?: string;
  providerToken?: string;
  user: User;
}

// Requirement: Security Controls - Session refresh request
export interface SessionRefreshRequest {
  refreshToken: string;
}

// Requirement: Authentication & Authorization - Role-based access control
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

// Requirement: Security Controls - JWT token payload structure
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  tier: UserSubscriptionTier;
  iat: number; // Issued at
  exp: number; // Expiration
}

// Requirement: Authentication & Authorization - Multi-factor authentication
export interface MFASetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Requirement: Security Controls - MFA verification
export interface MFAVerificationRequest {
  code: string;
  method: 'totp' | 'backup';
}

// Requirement: Authentication & Authorization - Session metadata
export interface SessionMetadata {
  userAgent: string;
  ipAddress: string;
  lastActive: number;
  deviceId: string;
}

// Requirement: Security Controls - Auth event types for logging
export enum AuthEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  SESSION_EXPIRED = 'session_expired',
  LOGIN_FAILED = 'login_failed'
}

// Requirement: Security Controls - Auth event logging
export interface AuthEvent {
  type: AuthEventType;
  userId: string;
  timestamp: number;
  metadata: SessionMetadata;
  success: boolean;
  error?: string;
}