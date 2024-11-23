"use client"; // Add this at the top

// Third-party imports
import React, { createContext, useContext, useEffect, useState } from 'react'; // ^18.0.0

// Internal imports
import { 
  AuthState, 
  AuthSession, 
  AuthCredentials, 
  PasswordResetRequest, 
  PasswordUpdateRequest 
} from '../types/auth';
import { 
  signIn, 
  signUp, 
  signOut, 
  resetPassword, 
  updatePassword, 
  getSession, 
  refreshSession 
} from '../lib/auth';
import supabase from '../lib/supabase';

/**
 * Human Tasks:
 * 1. Configure proper session storage mechanism in production environment
 * 2. Set up monitoring for authentication API response times
 * 3. Verify JWT token expiration settings in Supabase dashboard
 * 4. Configure proper CORS settings for authentication endpoints
 * 5. Test token refresh mechanism under different network conditions
 */

// Default auth state with loading and initialization flags
const defaultAuthState: AuthState = {
  initialized: false,
  loading: true,
  authenticated: false,
  session: null,
  user: null
};

// Create auth context with undefined initial value
const AuthContext = createContext<{
  state: AuthState;
  signIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  signUp: (credentials: AuthCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  updatePassword: (request: PasswordUpdateRequest) => Promise<void>;
} | undefined>(undefined);

// Requirement: Authentication & Authorization - JWT-based authentication with secure session management
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultAuthState);

  // Requirement: Authentication & Authorization - Initialize auth state on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get existing session if any
        const session = await getSession();
        
        if (session) {
          setState({
            initialized: true,
            loading: false,
            authenticated: true,
            session,
            user: session.user
          });
        } else {
          setState({
            ...defaultAuthState,
            initialized: true,
            loading: false
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState({
          ...defaultAuthState,
          initialized: true,
          loading: false
        });
      }
    };

    initialize();
  }, []);

  // Requirement: Authentication & Authorization - Handle auth state changes from Supabase
  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              // Get user profile and create auth session
              const userSession = await getSession();
              if (userSession) {
                setState({
                  initialized: true,
                  loading: false,
                  authenticated: true,
                  session: userSession,
                  user: userSession.user
                });
              }
            }
            break;

          case 'SIGNED_OUT':
            setState({
              ...defaultAuthState,
              initialized: true,
              loading: false
            });
            break;

          case 'TOKEN_REFRESHED':
            // Refresh local session data
            const refreshedSession = await refreshSession();
            if (refreshedSession) {
              setState({
                initialized: true,
                loading: false,
                authenticated: true,
                session: refreshedSession,
                user: refreshedSession.user
              });
            }
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setState({
          ...defaultAuthState,
          initialized: true,
          loading: false
        });
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Requirement: Security Controls - Authentication implementation using JWT with RSA-256
  const authContextValue = {
    state,
    signIn: async (credentials: AuthCredentials) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const response = await signIn(credentials);
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Authentication failed');
        }
        const session = response.data;
        setState({
          initialized: true,
          loading: false,
          authenticated: true,
          session,
          user: session.user
        });
        return session;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        throw error;
      }
    },
    signUp: async (credentials: AuthCredentials) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const response = await signUp(credentials);
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Registration failed');
        }
        const session = response.data;
        setState({
          initialized: true,
          loading: false,
          authenticated: true,
          session,
          user: session.user
        });
        return session;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        throw error;
      }
    },
    signOut: async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        await signOut();
        setState({
          ...defaultAuthState,
          initialized: true,
          loading: false
        });
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        throw error;
      }
    },
    resetPassword: async (request: PasswordResetRequest) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        await resetPassword(request);
        setState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        throw error;
      }
    },
    updatePassword: async (request: PasswordUpdateRequest) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        await updatePassword(request);
        setState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Requirement: Authentication & Authorization - Custom hook for accessing auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}