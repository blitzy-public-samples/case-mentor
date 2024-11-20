// react v18.0.0
import { useState, useCallback, useEffect } from 'react';

/**
 * Enum defining available toast notification types following the design system color palette
 * Addresses requirement: User Interface Design - Feedback Components
 */
export enum ToastType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

/**
 * Interface defining toast notification configuration options
 * Addresses requirement: Error Handling Display
 */
export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Interface defining the internal toast state structure
 */
interface ToastState {
  visible: boolean;
  options: ToastOptions | null;
}

/**
 * Default duration for toast notifications in milliseconds
 */
const DEFAULT_DURATION = 5000;

/**
 * Custom React hook that provides a self-contained interface for managing toast notifications
 * with automatic dismissal functionality.
 * 
 * Addresses requirements:
 * - User Interface Design - Feedback Components
 * - Error Handling Display
 * 
 * @returns Object containing show and hide methods, along with current toast state
 */
export const useToast = () => {
  // Initialize local state for toast visibility and options
  const [state, setState] = useState<ToastState>({
    visible: false,
    options: null
  });

  /**
   * Memoized method to show a toast notification
   * Accepts ToastOptions and updates visibility and options state
   */
  const show = useCallback((options: ToastOptions) => {
    setState({
      visible: true,
      options: {
        ...options,
        duration: options.duration || DEFAULT_DURATION
      }
    });
  }, []);

  /**
   * Memoized method to hide the current toast notification
   * Resets visibility and options state
   */
  const hide = useCallback(() => {
    setState({
      visible: false,
      options: null
    });
  }, []);

  /**
   * Effect to handle automatic toast dismissal based on duration
   * Sets up and cleans up timeout when toast is shown
   */
  useEffect(() => {
    if (state.visible && state.options) {
      const timer = setTimeout(() => {
        hide();
      }, state.options.duration || DEFAULT_DURATION);

      // Cleanup timeout on unmount or when toast changes
      return () => {
        clearTimeout(timer);
      };
    }
  }, [state.visible, state.options, hide]);

  // Return show/hide methods and current toast state
  return {
    show,
    hide,
    visible: state.visible,
    options: state.options
  };
};