// Third-party imports
'use client'
import React, { createContext, useContext, ReactNode, useEffect } from 'react'; // ^18.0.0

// Internal imports
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { UserProgress } from '../types/user';
import { APIError } from '../types/api';

/**
 * Human Tasks:
 * 1. Configure proper caching strategy based on user activity patterns
 * 2. Set up monitoring for progress data revalidation performance
 * 3. Test automatic update mechanism under different network conditions
 * 4. Verify progress calculation accuracy with product team
 */

// Progress update interval (5 minutes)
export const PROGRESS_UPDATE_INTERVAL = 300000;

// Progress context value interface
interface ProgressContextValue {
  progress: UserProgress | null;
  isLoading: boolean;
  error: APIError | null;
  updateProgress: () => Promise<void>;
}

// Create progress context
const ProgressContext = createContext<ProgressContextValue | null>(null);

/**
 * Progress Provider Component
 * Requirement: User Management - Progress tracking and performance analytics
 * Requirement: System Performance - Track and maintain >80% completion rate
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  // Get authenticated user state
  const { state: authState } = useAuth();

  // Initialize progress hook with user ID
  const {
    progress,
    isLoading,
    error,
    mutate: revalidateProgress
  } = useProgress(authState.user?.id || '');

  // Set up automatic progress updates
  useEffect(() => {
    if (!authState.authenticated) return;

    // Initial progress fetch
    revalidateProgress();

    // Set up periodic updates
    const updateInterval = setInterval(() => {
      revalidateProgress();
    }, PROGRESS_UPDATE_INTERVAL);

    // Cleanup interval on unmount or auth state change
    return () => {
      clearInterval(updateInterval);
    };
  }, [authState.authenticated, revalidateProgress]);

  // Force progress update function
  const updateProgress = async () => {
    try {
      await revalidateProgress();
    } catch (err) {
      console.error('Failed to update progress:', err);
      throw err;
    }
  };

  // Create context value
  const contextValue: ProgressContextValue = {
    progress,
    isLoading,
    error,
    updateProgress
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * Custom hook to access progress context
 * Requirement: User Management - Progress tracking and performance analytics
 */
export function useProgressContext(): ProgressContextValue {
  const context = useContext(ProgressContext);
  
  if (!context) {
    throw new Error('useProgressContext must be used within a ProgressProvider');
  }
  
  return context;
}