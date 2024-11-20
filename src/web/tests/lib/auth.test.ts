// Third-party imports
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.7.0
import { vi } from 'vitest'; // ^0.34.0

// Internal imports
import { 
  signIn, 
  signUp, 
  signOut, 
  resetPassword, 
  updatePassword, 
  getSession, 
  refreshSession 
} from '../../lib/auth';
import supabase from '../../lib/supabase';
import type { 
  AuthCredentials, 
  AuthSession, 
  PasswordResetRequest, 
  PasswordUpdateRequest 
} from '../../types/auth';

// Mock test data
const mockValidCredentials: AuthCredentials = {
  email: 'test@example.com',
  password: 'ValidPass123!'
};

const mockInvalidCredentials: AuthCredentials = {
  email: 'invalid@example.com',
  password: 'wrong'
};

const mockSession: AuthSession = {
  access_token: 'mock-jwt-token',
  expires_at: 1234567890,
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'mock-user-id',
    email: 'test@example.com'
  }
};

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn()
    }
  }
}));

describe('signIn', () => {
  // Requirement: Authentication & Authorization - Test coverage for JWT-based authentication
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign in with valid credentials', async () => {
    const mockAuthResponse = {
      data: {
        user: mockSession.user,
        session: mockSession
      },
      error: null
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockAuthResponse);

    const result = await signIn(mockValidCredentials);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockValidCredentials.email,
      password: mockValidCredentials.password
    });
  });

  it('should fail sign in with invalid credentials', async () => {
    const mockErrorResponse = {
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(mockErrorResponse);

    const result = await signIn(mockInvalidCredentials);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('should handle network errors during sign in', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(new Error('Network error'));

    const result = await signIn(mockValidCredentials);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INTERNAL_ERROR');
  });
});

describe('signUp', () => {
  // Requirement: Security Controls - Verification of authentication implementation
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully register with valid credentials', async () => {
    const mockAuthResponse = {
      data: {
        user: mockSession.user,
        session: mockSession
      },
      error: null
    };

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockAuthResponse);

    const result = await signUp(mockValidCredentials);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should fail registration with existing email', async () => {
    const mockErrorResponse = {
      data: { user: null, session: null },
      error: { message: 'User already registered' }
    };

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce(mockErrorResponse);

    const result = await signUp(mockValidCredentials);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should validate password requirements', async () => {
    const invalidCredentials = {
      email: 'test@example.com',
      password: '123' // Too short
    };

    const result = await signUp(invalidCredentials);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });
});

describe('signOut', () => {
  // Requirement: Authentication & Authorization - Session management
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign out and clear session', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

    await signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle errors during sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(new Error('Sign out failed'));

    await signOut(); // Should not throw

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  // Requirement: Security Controls - Password reset functionality
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully initiate password reset', async () => {
    const resetRequest: PasswordResetRequest = { email: 'test@example.com' };

    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({ error: null });

    const result = await resetPassword(resetRequest);

    expect(result.success).toBe(true);
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(resetRequest.email);
  });

  it('should validate email format', async () => {
    const invalidRequest: PasswordResetRequest = { email: 'invalid-email' };

    const result = await resetPassword(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });
});

describe('updatePassword', () => {
  // Requirement: Security Controls - Password update mechanism
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update password', async () => {
    const updateRequest: PasswordUpdateRequest = {
      token: 'valid-token',
      newPassword: 'NewSecurePass123!'
    };

    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({ 
      data: { user: mockSession.user },
      error: null 
    });

    const result = await updatePassword(updateRequest);

    expect(result.success).toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ 
      password: updateRequest.newPassword 
    });
  });

  it('should validate password strength', async () => {
    const weakPasswordRequest: PasswordUpdateRequest = {
      token: 'valid-token',
      newPassword: '123' // Too weak
    };

    const result = await updatePassword(weakPasswordRequest);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });
});

describe('getSession', () => {
  // Requirement: Authentication & Authorization - Session retrieval
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully retrieve active session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    const result = await getSession();

    expect(result).toBeDefined();
    expect(result?.user).toBeDefined();
    expect(result?.session).toBeDefined();
  });

  it('should return null when no active session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null
    });

    const result = await getSession();

    expect(result).toBeNull();
  });
});

describe('refreshSession', () => {
  // Requirement: Authentication & Authorization - Token refresh mechanism
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully refresh session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce({
      data: { session: { ...mockSession, access_token: 'new-token' } },
      error: null
    });

    const result = await refreshSession();

    expect(result).toBeDefined();
    expect(result?.session.access_token).toBe('new-token');
  });

  it('should return null when refresh fails', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    });

    vi.mocked(supabase.auth.refreshSession).mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Refresh failed' }
    });

    const result = await refreshSession();

    expect(result).toBeNull();
  });
});