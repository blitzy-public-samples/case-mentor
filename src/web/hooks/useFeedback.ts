// Third-party imports
import { useState, useCallback } from 'react'; // ^18.0.0
import { useQuery, useMutation } from 'react-query'; // ^3.39.0

// Internal imports
import { AIFeedback, FeedbackHistory, FeedbackResponse } from '../types/feedback';
import { api } from '../lib/api';
import { useToast, ToastType } from './useToast';

/**
 * Human Tasks:
 * 1. Configure react-query caching strategy in QueryClientProvider
 * 2. Set up error monitoring for feedback API endpoints
 * 3. Verify feedback polling intervals with product team
 * 4. Test feedback request rate limiting under load
 */

// Cache keys for react-query
const FEEDBACK_KEYS = {
  feedback: (drillId: string) => ['feedback', drillId],
  history: (drillId: string) => ['feedback-history', drillId],
};

/**
 * Custom hook for managing AI-powered feedback for case interview practice drills
 * Implements comprehensive feedback management with react-query for caching
 * 
 * Requirement: AI Evaluation - Core service for AI-powered feedback and evaluation
 * with real-time updates and caching
 * 
 * @param drillId - Unique identifier for the practice drill
 */
export const useFeedback = (drillId: string) => {
  // Initialize toast notifications
  const toast = useToast();

  // Track if feedback request is in progress
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Fetch feedback data with caching
   * Requirement: AI Evaluation - Real-time feedback updates with caching
   */
  const {
    data: feedback,
    isLoading: isFeedbackLoading,
    error: feedbackError,
    refetch: refetchFeedback
  } = useQuery<AIFeedback | null, Error>(
    FEEDBACK_KEYS.feedback(drillId),
    async () => {
      try {
        const response = await api.get<FeedbackResponse>(`/api/feedback/${drillId}`);
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to fetch feedback');
        }
        return response.data.data;
      } catch (error) {
        throw new Error('Error fetching feedback data');
      }
    },
    {
      staleTime: 30000, // Consider data fresh for 30 seconds
      cacheTime: 300000, // Cache for 5 minutes
      retry: 2,
      enabled: Boolean(drillId)
    }
  );

  /**
   * Fetch feedback history with caching
   * Requirement: Progress Tracking - Performance tracking and feedback management
   */
  const {
    data: history,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory
  } = useQuery<FeedbackHistory | null, Error>(
    FEEDBACK_KEYS.history(drillId),
    async () => {
      try {
        const response = await api.get<FeedbackHistory>(`/api/feedback/history/${drillId}`);
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to fetch feedback history');
        }
        return response.data;
      } catch (error) {
        throw new Error('Error fetching feedback history');
      }
    },
    {
      staleTime: 60000, // Consider history fresh for 1 minute
      cacheTime: 300000, // Cache for 5 minutes
      retry: 2,
      enabled: Boolean(drillId)
    }
  );

  /**
   * Mutation for requesting new feedback
   * Requirement: AI Evaluation - Real-time feedback generation
   */
  const { mutateAsync: requestFeedbackMutation } = useMutation<
    AIFeedback,
    Error,
    void
  >(
    async () => {
      const response = await api.post<FeedbackResponse>(`/api/feedback/request/${drillId}`, {});
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to request feedback');
      }
      return response.data.data;
    },
    {
      onSuccess: () => {
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Feedback generated successfully'
        });
        refetchFeedback();
        refetchHistory();
      },
      onError: (error) => {
        toast.show({
          type: ToastType.ERROR,
          message: error.message || 'Failed to generate feedback'
        });
      }
    }
  );

  /**
   * Request new feedback for the current drill
   * Requirement: AI Evaluation - Feedback request handling
   */
  const requestFeedback = useCallback(async () => {
    if (isRequesting) return;

    try {
      setIsRequesting(true);
      await requestFeedbackMutation();
    } finally {
      setIsRequesting(false);
    }
  }, [isRequesting, requestFeedbackMutation]);

  /**
   * Refresh feedback history data
   * Requirement: Progress Tracking - Historical data analysis
   */
  const refreshHistory = useCallback(async () => {
    try {
      await refetchHistory();
      toast.show({
        type: ToastType.SUCCESS,
        message: 'Feedback history updated'
      });
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: 'Failed to update feedback history'
      });
    }
  }, [refetchHistory, toast]);

  // Combine loading states
  const isLoading = isFeedbackLoading || isHistoryLoading || isRequesting;

  // Combine errors
  const error = feedbackError || historyError;

  return {
    feedback,
    history,
    isLoading,
    error,
    requestFeedback,
    refreshHistory
  };
};