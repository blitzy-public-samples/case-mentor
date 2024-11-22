// react v18.0.0

"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/shared/Toast';
import { ToastType, type ToastOptions } from '../hooks/useToast';

/**
 * Human Tasks:
 * 1. Verify toast notifications are visible and readable across all viewport sizes
 * 2. Test screen reader announcements for different toast types
 * 3. Validate toast positioning doesn't interfere with main content interaction
 * 4. Ensure toast animations perform well on low-end devices
 */

/**
 * Interface defining the toast context value shape
 * Addresses requirement: User Interface Design - Feedback Components
 */
interface ToastContextType {
  show: (options: ToastOptions) => void;
  hide: () => void;
  visible: boolean;
  options: ToastOptions | null;
}

/**
 * Props interface for the ToastProvider component
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Create the toast context with undefined default value
 * Context will be populated by the provider
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider component that manages global toast notification state
 * Addresses requirements:
 * - User Interface Design - Feedback Components
 * - Error Handling Display
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // State for managing toast visibility and options
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions | null>(null);

  /**
   * Show toast notification with the provided options
   * Addresses requirement: Error Handling Display
   */
  const show = useCallback((toastOptions: ToastOptions) => {
    setOptions({
      ...toastOptions,
      // Ensure type is valid, default to INFO if not specified
      type: toastOptions.type || ToastType.INFO,
      // Ensure message exists
      message: toastOptions.message || 'Notification'
    });
    setVisible(true);
  }, []);

  /**
   * Hide the currently displayed toast notification
   */
  const hide = useCallback(() => {
    setVisible(false);
    setOptions(null);
  }, []);

  // Create context value object with show/hide methods and current state
  const contextValue: ToastContextType = {
    show,
    hide,
    visible,
    options
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={visible}
        options={options}
        onClose={hide}
      />
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to access toast context throughout the application
 * Throws error if used outside ToastProvider
 */
export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  
  return context;
};

// Default export of ToastProvider component
export default ToastProvider;