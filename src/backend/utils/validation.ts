// @package zod ^3.22.0
import { z } from 'zod';
import { APIError, APIErrorCode } from '../types/api';
import { DrillType, DrillDifficulty } from '../types/drills';
import { SpeciesType } from '../types/simulation';
import { UserSubscriptionTier } from '../types/user';

/**
 * Human Tasks:
 * 1. Configure error monitoring service to track validation failure patterns
 * 2. Set up performance monitoring for validation functions to ensure <200ms response time
 * 3. Review and update validation rules periodically based on user feedback and system requirements
 * 4. Implement caching for frequently validated data patterns
 */

// Requirement: Security Controls - Input validation for drill attempts
export async function validateDrillAttempt(attempt: any): Promise<boolean> {
  const drillAttemptSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    drillId: z.string().uuid(),
    type: z.nativeEnum(DrillType),
    difficulty: z.nativeEnum(DrillDifficulty),
    response: z.string().min(1).max(10000),
    startedAt: z.date(),
    timeSpent: z.number().int().min(0).max(7200) // Max 2 hours
  });

  try {
    await drillAttemptSchema.parseAsync(attempt);
    
    if (attempt.timeSpent < 60 && attempt.difficulty === DrillDifficulty.ADVANCED) {
      throw new Error('Advanced drills require minimum 1 minute completion time');
    }

    if (attempt.response.length < 100 && 
        [DrillType.CASE_PROMPT, DrillType.BRAINSTORMING, DrillType.SYNTHESIZING].includes(attempt.type)) {
      throw new Error('Qualitative drill responses require minimum 100 characters');
    }

    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid drill attempt data',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: attempt
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    } as APIError;
  }
}

// Requirement: System Performance - Efficient validation for simulation parameters
export async function validateSimulationParameters(params: any): Promise<boolean> {
  const environmentParamsSchema = z.object({
    temperature: z.number().min(0).max(50),
    depth: z.number().min(0).max(1000),
    salinity: z.number().min(0).max(40),
    lightLevel: z.number().min(0).max(100),
    speciesType: z.nativeEnum(SpeciesType),
    populationSize: z.number().int().min(1).max(1000),
    simulationDuration: z.number().int().min(60).max(3600) // 1-60 minutes
  });

  try {
    await environmentParamsSchema.parseAsync(params);

    if (params.depth > 200 && params.lightLevel > 50) {
      throw new Error('Light levels cannot exceed 50% at depths greater than 200m');
    }

    if (params.temperature > 30 && params.speciesType === SpeciesType.PRODUCER) {
      throw new Error('Producer species cannot survive in temperatures above 30°C');
    }

    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid simulation parameters',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: params
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    } as APIError;
  }
}

// Requirement: Security Controls - User profile validation
export async function validateUserProfile(profile: any): Promise<boolean> {
  const userProfileSchema = z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    subscriptionTier: z.nativeEnum(UserSubscriptionTier),
    preferences: z.object({
      notifications: z.boolean(),
      timezone: z.string(),
      language: z.string().length(2)
    }).optional()
  });

  try {
    await userProfileSchema.parseAsync(profile);

    if (profile.email.endsWith('.test')) {
      throw new Error('Test email domains are not allowed');
    }

    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid user profile data',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: profile
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    } as APIError;
  }
}

// Requirement: Security Controls - Subscription change validation
export async function validateSubscriptionChange(request: any): Promise<boolean> {
  const subscriptionChangeSchema = z.object({
    userId: z.string().uuid(),
    currentTier: z.nativeEnum(UserSubscriptionTier),
    newTier: z.nativeEnum(UserSubscriptionTier),
    paymentMethod: z.object({
      type: z.enum(['credit_card', 'paypal']),
      token: z.string()
    }).optional()
  });

  try {
    await subscriptionChangeSchema.parseAsync(request);

    const allowedTransitions: Record<UserSubscriptionTier, UserSubscriptionTier[]> = {
      [UserSubscriptionTier.FREE]: [UserSubscriptionTier.BASIC, UserSubscriptionTier.PREMIUM],
      [UserSubscriptionTier.BASIC]: [UserSubscriptionTier.PREMIUM, UserSubscriptionTier.FREE],
      [UserSubscriptionTier.PREMIUM]: [UserSubscriptionTier.BASIC, UserSubscriptionTier.FREE]
    };

    const currentTier = request.currentTier as UserSubscriptionTier;
    if (!allowedTransitions[currentTier].includes(request.newTier)) {
      throw new Error(`Invalid subscription transition from ${request.currentTier} to ${request.newTier}`);
    }

    if (request.currentTier === UserSubscriptionTier.FREE && 
        [UserSubscriptionTier.BASIC, UserSubscriptionTier.PREMIUM].includes(request.newTier) && 
        !request.paymentMethod) {
      throw new Error('Payment method required for subscription upgrade');
    }

    return true;
  } catch (error) {
    throw {
      code: APIErrorCode.VALIDATION_ERROR,
      message: 'Invalid subscription change request',
      details: {
        error: error instanceof Error ? error.message : 'Validation failed',
        fields: request
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    } as APIError;
  }
}