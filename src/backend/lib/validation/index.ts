// @package zod ^3.22.0
import { z } from 'zod';

// Import drill validation functions and schemas
import {
  validateDrillPrompt,
  validateDrillResponse,
  validateDrillEvaluation,
  DRILL_PROMPT_SCHEMA,
  DRILL_ATTEMPT_SCHEMA,
  DRILL_EVALUATION_SCHEMA
} from './drills';

// Import simulation validation functions and schemas
import {
  validateSpecies,
  validateEnvironment,
  validateInteraction,
  validateSimulationState,
  simulationSchemas
} from './simulation';

// Import user validation functions and schemas
import {
  validateUserRegistration,
  validateProfileUpdate,
  validateSubscriptionUpdate,
  userRegistrationSchema,
  userProfileSchema,
  subscriptionUpdateSchema
} from './users';

/**
 * Human Tasks:
 * 1. Monitor validation performance metrics to ensure <100ms response time
 * 2. Set up error tracking for validation failures in production environment
 * 3. Implement caching strategy for frequently validated data patterns
 * 4. Configure proper logging for validation errors across all modules
 */

// Requirement: Input Validation (7.3.6 Security Controls)
// Export drill validation functions and schemas
export const drillValidation = {
  validateDrillPrompt,
  validateDrillResponse,
  validateDrillEvaluation,
  DRILL_PROMPT_SCHEMA,
  DRILL_ATTEMPT_SCHEMA,
  DRILL_EVALUATION_SCHEMA
} as const;

// Requirement: Security Controls (8.3.3 Input Validation)
// Export simulation validation functions and schemas
export const simulationValidation = {
  validateSpecies,
  validateEnvironment,
  validateInteraction,
  validateSimulationState,
  simulationSchemas
} as const;

// Requirement: Security Controls (8.3.3 Input Validation)
// Export user validation functions and schemas
export const userValidation = {
  validateUserRegistration,
  validateProfileUpdate,
  validateSubscriptionUpdate,
  userRegistrationSchema,
  userProfileSchema,
  subscriptionUpdateSchema
} as const;

// Type exports for better type inference
export type DrillValidation = typeof drillValidation;
export type SimulationValidation = typeof simulationValidation;
export type UserValidation = typeof userValidation;

// Export zod types for external use
export type ZodType = z.ZodType;
export type ZodSchema = z.ZodSchema;
export type ZodError = z.ZodError;
export type ZodIssue = z.ZodIssue;