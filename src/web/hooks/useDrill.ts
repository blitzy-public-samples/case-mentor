// Third-party imports
import { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { useQuery, useMutation } from '@tanstack/react-query'; // ^4.0.0

// Internal imports
import { 
  DrillType, 
  DrillPrompt, 
  DrillAttempt, 
  DrillProgress, 
  DrillResponse, 
  DrillFeedback, 
  DrillDifficulty 
} from '../types/drills';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

/**
 * Human Tasks:
 * 1. Configure proper caching strategies in react-query for drill data
 * 2. Set up monitoring for drill API response times
 * 3. Verify drill attempt submission rate limits with backend team
 * 4. Test error handling under various network conditions
 * 5. Validate drill progress calculation logic with product team
 */

/**
 * Custom hook for managing drill operations and state
 * Requirement: Practice Drills - Implements drill management functionality
 */
export function useDrill(drillType: DrillType) {
  // Get auth state for user context
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  // Initialize error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches available drills based on type and user subscription
   * Requirement: Practice Drills - Drill type-specific content delivery
   */
  const fetchDrills = useCallback(async (): Promise<DrillPrompt[]> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await api.get<DrillResponse>(`/api/drills/${drillType}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch drills');
    }

    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response format: expected array of drills');
    }

    return response.data as DrillPrompt[];
  }, [drillType, userId]);

  /**
   * Fetches user's progress for specific drill type
   * Requirement: User Management - Progress tracking and analytics
   */
  const fetchProgress = useCallback(async (): Promise<DrillProgress> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await api.get<DrillResponse>(`/api/drills/${drillType}/progress`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch progress');
    }

    return response.data as DrillProgress;
  }, [drillType, userId]);

  /**
   * Query hook for fetching drills with caching
   * Requirement: System Performance - Ensures <200ms API response time
   */
  const { 
    data: drills = [], 
    isLoading: loading 
  } = useQuery(
    ['drills', drillType, userId],
    fetchDrills,
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  /**
   * Query hook for fetching progress with caching
   * Requirement: User Management - Real-time progress updates
   */
  const { 
    data: progress,
    refetch: refetchProgress 
  } = useQuery(
    ['progress', drillType, userId],
    fetchProgress,
    {
      enabled: !!userId,
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: 2,
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  /**
   * Submits a drill attempt for evaluation
   * Requirement: Practice Drills - Attempt submission and feedback
   */
  const submitAttemptMutation = useMutation(
    async ({ 
      promptId, 
      response, 
      timeSpent 
    }: { 
      promptId: string; 
      response: string; 
      timeSpent: number; 
    }) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const attemptData: Partial<DrillAttempt> = {
        promptId,
        response,
        timeSpent,
        userId
      };

      const result = await api.post<DrillResponse>(
        `/api/drills/${drillType}/attempts`,
        attemptData
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to submit attempt');
      }

      return result.data;
    },
    {
      onSuccess: () => {
        // Refresh progress data after successful attempt
        refetchProgress();
      },
      onError: (error: Error) => {
        setError(error.message);
      }
    }
  );

  /**
   * Wrapper function for submitting drill attempts
   * Requirement: Practice Drills - Comprehensive drill management
   */
  const submitAttempt = useCallback(
    async (promptId: string, response: string, timeSpent: number) => {
      try {
        const result = await submitAttemptMutation.mutateAsync({
          promptId,
          response,
          timeSpent
        });
        return result;
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
        throw error;
      }
    },
    [submitAttemptMutation]
  );

  // Clear error on drill type change
  useEffect(() => {
    setError(null);
  }, [drillType]);

  return {
    drills,
    loading,
    error,
    submitAttempt,
    progress
  };
}