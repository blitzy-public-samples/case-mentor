// Third-party imports
import { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import useSWR from 'swr'; // ^2.0.0

// Internal imports
import { api } from '../lib/api';
import { UserProgress } from '../types/user';
import { APIResponse } from '../types/api';

/**
 * Human Tasks:
 * 1. Configure proper cache invalidation strategy based on user activity patterns
 * 2. Set up monitoring for progress data fetch performance
 * 3. Verify progress calculation formulas with product team
 * 4. Test error handling under various network conditions
 */

// Cache duration for progress data (5 minutes)
const CACHE_TIME = 300000;

// Progress endpoint URL template
const PROGRESS_ENDPOINT = '/api/users/${userId}/progress';

/**
 * Custom hook for fetching and managing user progress data with automatic revalidation.
 * Implements SWR for efficient data fetching, caching, and revalidation.
 * 
 * Requirement: User Management - Progress tracking and performance analytics
 * Requirement: System Performance - Track and maintain >80% completion rate
 */
export function useProgress(userId: string) {
  // State for tracking loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<APIResponse<UserProgress>['error']>(null);

  // Construct the progress endpoint URL
  const progressUrl = PROGRESS_ENDPOINT.replace('${userId}', userId);

  // Progress data fetcher function with type safety
  const fetchProgress = useCallback(async (url: string) => {
    try {
      const response = await api.get<UserProgress>(url);
      
      if (!response.success || !response.data) {
        throw response.error;
      }

      // Validate required progress data fields
      const progress = response.data;
      if (
        typeof progress.drillsCompleted !== 'number' ||
        typeof progress.drillsSuccessRate !== 'number' ||
        typeof progress.simulationsCompleted !== 'number' ||
        typeof progress.simulationsSuccessRate !== 'number' ||
        !progress.skillLevels ||
        !(progress.lastUpdated instanceof Date)
      ) {
        throw new Error('Invalid progress data format');
      }

      return progress;
    } catch (err) {
      setError(err as APIResponse<UserProgress>['error']);
      throw err;
    }
  }, []);

  // Initialize SWR hook with progress endpoint and fetcher
  const {
    data: progress,
    error: swrError,
    mutate
  } = useSWR<UserProgress>(
    progressUrl,
    fetchProgress,
    {
      // Configure SWR options for optimal performance
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: CACHE_TIME,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000, // Retry every 5 seconds
      onSuccess: () => {
        setIsLoading(false);
        setError(null);
      },
      onError: (err) => {
        setIsLoading(false);
        setError(err as APIResponse<UserProgress>['error']);
      }
    }
  );

  // Effect to handle initial loading state
  useEffect(() => {
    if (!progress && !swrError) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [progress, swrError]);

  // Manual revalidation function with error handling
  const revalidateProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      await mutate();
    } catch (err) {
      setError(err as APIResponse<UserProgress>['error']);
    } finally {
      setIsLoading(false);
    }
  }, [mutate]);

  return {
    progress: progress || null,
    isLoading,
    error,
    mutate: revalidateProgress
  };
}