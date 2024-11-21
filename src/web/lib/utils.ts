// @ts-check

/**
 * Human Tasks:
 * 1. Verify date format strings align with UI design system requirements
 * 2. Confirm error message templates with product team
 * 3. Update API error codes mapping if backend error codes change
 * 4. Set up monitoring for duration formatting performance
 */

// Third-party imports
import { format } from 'date-fns'; // ^2.30.0
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Internal imports
import { APIResponse, APIError, ErrorCode } from '../types/api';
import { DrillType, DrillDifficulty } from '../types/drills';

// Requirement: User Interface Design - Tailwind CSS class name merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Alias for backward compatibility
export const classNames = cn;

// Requirement: User Interface Design - Consistent date formatting across application
export function formatDate(date: Date | string | number, formatString: string): string {
  if (!date) {
    throw new Error('Date parameter is required');
  }

  try {
    const dateObject = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    if (isNaN(dateObject.getTime())) {
      throw new Error('Invalid date provided');
    }

    return format(dateObject, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    throw new Error('Failed to format date');
  }
}

// Requirement: System Performance - Standardized duration formatting for performance metrics
export function formatDuration(milliseconds: number): string {
  if (typeof milliseconds !== 'number' || milliseconds < 0) {
    throw new Error('Duration must be a positive number');
  }

  try {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    if (minutes === 0) {
      return `${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  } catch (error) {
    console.error('Duration formatting error:', error);
    throw new Error('Failed to format duration');
  }
}

// Requirement: User Interface Design - Consistent score presentation
export function formatScore(score: number, decimalPlaces: number = 1): string {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new Error('Score must be a number between 0 and 1');
  }

  if (typeof decimalPlaces !== 'number' || decimalPlaces < 0) {
    throw new Error('Decimal places must be a non-negative number');
  }

  try {
    const percentage = (score * 100).toFixed(decimalPlaces);
    return `${percentage}%`;
  } catch (error) {
    console.error('Score formatting error:', error);
    throw new Error('Failed to format score');
  }
}

// Requirement: User Interface Design - Drill type validation
export function isValidDrillType(value: unknown): value is DrillType {
  if (typeof value !== 'string') {
    return false;
  }

  return Object.values(DrillType).includes(value as DrillType);
}

// Requirement: User Interface Design - Drill difficulty validation
export function isValidDifficulty(value: unknown): value is DrillDifficulty {
  if (typeof value !== 'string') {
    return false;
  }

  return Object.values(DrillDifficulty).includes(value as DrillDifficulty);
}

// Requirement: User Interface Design - Consistent error message presentation
export function handleAPIError(error: APIError): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred';
  }

  try {
    const errorMessages: Record<ErrorCode, string> = {
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
      [ErrorCode.AUTHENTICATION_ERROR]: 'Please sign in to continue',
      [ErrorCode.RATE_LIMIT_ERROR]: 'Too many requests. Please try again later',
      [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Our team has been notified'
    };

    const defaultMessage = 'An unexpected error occurred';
    const baseMessage = errorMessages[error.code] || defaultMessage;

    // Include additional error details if available
    if (error.details && Object.keys(error.details).length > 0) {
      const details = Object.entries(error.details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `${baseMessage} (${details})`;
    }

    return baseMessage;
  } catch (err) {
    console.error('Error handling API error:', err);
    return 'An unexpected error occurred';
  }
}