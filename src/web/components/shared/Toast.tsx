// react v18.0.0
import React from 'react';
// framer-motion v10.0.0
import { motion } from 'framer-motion';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';
import { ToastType, type ToastOptions } from '../../hooks/useToast';
import { theme } from '../../config/theme';

/**
 * Human Tasks:
 * 1. Verify toast animations perform well on low-end devices
 * 2. Test screen reader announcements for different toast types
 * 3. Validate color contrast ratios in different color modes
 * 4. Ensure toast positioning doesn't interfere with interactive elements
 */

interface ToastProps {
  visible: boolean;
  options: ToastOptions | null;
  onClose: () => void;
}

/**
 * Generates WCAG compliant toast variant styles based on type
 * Addresses requirement: Accessibility Requirements
 */
const getToastStyles = (type: ToastType) => {
  const styles = {
    background: '',
    border: '',
    text: '',
    shadow: theme.shadows.lg
  };

  switch (type) {
    case ToastType.SUCCESS:
      styles.background = `${theme.colors.accent.base}`;
      styles.border = `${theme.colors.accent.active}`;
      styles.text = '#FFFFFF'; // Ensures WCAG AA contrast
      break;
    case ToastType.ERROR:
      styles.background = `${theme.colors.error.base}`;
      styles.border = `${theme.colors.error.active}`;
      styles.text = '#FFFFFF';
      break;
    case ToastType.WARNING:
      styles.background = `${theme.colors.warning.base}`;
      styles.border = `${theme.colors.warning.active}`;
      styles.text = '#000000'; // Dark text for better contrast
      break;
    case ToastType.INFO:
      styles.background = `${theme.colors.secondary.base}`;
      styles.border = `${theme.colors.secondary.active}`;
      styles.text = '#FFFFFF';
      break;
  }

  return styles;
};

/**
 * Toast component for displaying accessible notifications
 * Addresses requirements:
 * - User Interface Design - Feedback Components
 * - Error Handling Display
 * - Accessibility Requirements
 */
const Toast: React.FC<ToastProps> = ({ visible, options, onClose }) => {
  if (!visible || !options) return null;

  const styles = getToastStyles(options.type);

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'max-w-md rounded-lg p-4',
        'flex items-center justify-between',
        'shadow-lg border-l-4'
      )}
      style={{
        backgroundColor: styles.background,
        borderLeftColor: styles.border,
        color: styles.text,
        boxShadow: styles.shadow
      }}
    >
      <div className="flex-1 mr-4">
        <p className="font-medium text-sm">{options.message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-black/10 focus:bg-black/10 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close notification"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

export default Toast;