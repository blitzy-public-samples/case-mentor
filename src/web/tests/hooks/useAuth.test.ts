// Third-party imports
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.0.0
import { renderHook, act } from '@testing-library/react-hooks'; // ^8.0.0
import { Session } from '@supabase/supabase-js'; // ^2.38.0

// Internal imports
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import { 
  AuthState, 
  AuthCredentials, 
  AuthResponse, 
  AuthSession, 
  PasswordResetRequest 
} from '../../types/auth';

/**
 * Human Tasks:
 * 1. Configure test environment variables for Supabase client
 * 2. Set up test database with mock user data
 * 3. Verify JWT token settings match production environment
 * 4. Configure proper CORS settings for test environment
 */

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: mockUserProfile }))
        }))
      }))
    }))
  }
}));

// Mock test data
const mockUserProfile = {
  id: '123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

const mockSession: Session = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '123',
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: ''
  }
};

const mockAuthSession: AuthSession = {
  user: mockSession.user,
  session: mockSession,
  profile: mockUserProfile,
  expiresAt: mockSession.expires_at
};

describe('useAuth', () => {
  // Requirement: Authentication & Authorization - Verify JWT-based authentication
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock getSession to return null initially
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
  });

  afterEach(() => {
    // Clean up subscriptions and mocks
    jest.clearAllMocks();
  });

  // Requirement: Authentication & Authorization - Test initial loading state
  it('should initialize with loading state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth());
    
    expect(result.current.state.loading).toBe(true);
    expect(result.current.state.authenticated).toBe(false);
    expect(result.current.state.session).toBeNull();
    
    await waitForNextUpdate();
    
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.initialized).toBe(true);
  });

  // Requirement: Authentication & Authorization - Test successful login
  it('should handle successful login', async () => {
    // Mock successful login response
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null
    });

    const { result } = renderHook(() => useAuth());
    
    const credentials: AuthCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    await act(async () => {
      const response = await result.current.login(credentials);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAuthSession);
    });

    expect(result.current.state.authenticated).toBe(true);
    expect(result.current.state.session).toEqual(mockAuthSession);
    expect(result.current.state.user).toEqual(mockSession.user);
  });

  // Requirement: Security Controls - Test login error handling
  it('should handle login errors', async () => {
    const mockError = new Error('Invalid credentials');
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError
    });

    const { result } = renderHook(() => useAuth());
    
    const credentials: AuthCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await act(async () => {
      const response = await result.current.login(credentials);
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
      expect(response.error?.message).toBe('Login failed');
    });

    expect(result.current.state.authenticated).toBe(false);
    expect(result.current.state.session).toBeNull();
  });

  // Requirement: Authentication & Authorization - Test successful registration
  it('should handle successful registration', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null
    });

    const { result } = renderHook(() => useAuth());
    
    const credentials: AuthCredentials = {
      email: 'newuser@example.com',
      password: 'password123'
    };

    await act(async () => {
      const response = await result.current.register(credentials);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAuthSession);
    });

    expect(result.current.state.authenticated).toBe(true);
    expect(result.current.state.session).toEqual(mockAuthSession);
  });

  // Requirement: Security Controls - Test logout functionality
  it('should handle logout', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null
    });

    const { result } = renderHook(() => useAuth());
    
    // Set initial authenticated state
    result.current.state.authenticated = true;
    result.current.state.session = mockAuthSession;

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.state.authenticated).toBe(false);
    expect(result.current.state.session).toBeNull();
    expect(result.current.state.user).toBeNull();
  });

  // Requirement: Security Controls - Test password reset
  it('should handle password reset request', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null
    });

    const { result } = renderHook(() => useAuth());
    
    const resetRequest: PasswordResetRequest = {
      email: 'test@example.com'
    };

    await act(async () => {
      const response = await result.current.resetPassword(resetRequest);
      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
    });
  });

  // Requirement: Authentication & Authorization - Test session management
  it('should handle auth state changes', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth());
    
    // Mock auth state change to signed in
    await act(async () => {
      const authStateChange = (supabase.auth.onAuthStateChange as jest.Mock)
        .mock.calls[0][0];
      
      await authStateChange('SIGNED_IN', mockSession);
    });

    expect(result.current.state.authenticated).toBe(true);
    expect(result.current.state.session?.user).toEqual(mockSession.user);

    // Mock auth state change to signed out
    await act(async () => {
      const authStateChange = (supabase.auth.onAuthStateChange as jest.Mock)
        .mock.calls[0][0];
      
      await authStateChange('SIGNED_OUT', null);
    });

    expect(result.current.state.authenticated).toBe(false);
    expect(result.current.state.session).toBeNull();
  });
});