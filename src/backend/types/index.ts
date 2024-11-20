/**
 * Human Tasks:
 * 1. Ensure all imported type definition files are included in tsconfig.json
 * 2. Verify that all re-exported types are being used correctly in dependent services
 * 3. Set up automated tests to verify type compatibility across services
 * 4. Configure IDE settings for optimal TypeScript support and type checking
 */

// Requirement: Type Safety - TypeScript for strong typing and enhanced IDE support
// Import all type definitions from respective modules
import * as api from './api';
import * as drills from './drills';
import * as simulation from './simulation';
import * as user from './user';
import * as subscription from './subscription';

// Requirement: Code Organization - Centralized type definitions for consistent data structures across services

// API Types namespace
export namespace APITypes {
    export const { 
        HTTPMethod,
        APIErrorCode
    } = api;

    export type APIError = api.APIError;
    export type APIResponse<T> = api.APIResponse<T>;
    export type PaginationParams = api.PaginationParams;
    export type PaginatedResponse<T> = api.PaginatedResponse<T>;
    export type RateLimitInfo = api.RateLimitInfo;
}

// Drill Types namespace
export namespace DrillTypes {
    export const {
        DrillType,
        DrillDifficulty,
        DrillStatus
    } = drills;

    export type DrillPrompt = drills.DrillPrompt;
    export type DrillAttempt = drills.DrillAttempt;
    export type DrillEvaluation = drills.DrillEvaluation;
    export type DrillResponse<T> = drills.DrillResponse<T>;
}

// Simulation Types namespace
export namespace SimulationTypes {
    export const {
        SpeciesType,
        SimulationStatus
    } = simulation;

    export type Species = simulation.Species;
    export type EnvironmentParameters = simulation.EnvironmentParameters;
    export type SimulationState = simulation.SimulationState;
    export type SimulationResult = simulation.SimulationResult;
    export type SimulationResponse<T> = simulation.SimulationResponse<T>;
}

// User Types namespace
export namespace UserTypes {
    export const {
        UserSubscriptionTier,
        UserSubscriptionStatus,
        UserPreparationLevel
    } = user;

    export type User = user.User;
    export type UserProfile = user.UserProfile;
    export type UserProgress = user.UserProgress;
}

// Subscription Types namespace
export namespace SubscriptionTypes {
    export type SubscriptionPlan = subscription.SubscriptionPlan;
    export type SubscriptionFeature = subscription.SubscriptionFeature;
    export type SubscriptionLimits = subscription.SubscriptionLimits;
    export type Subscription = subscription.Subscription;
    export type SubscriptionUsage = subscription.SubscriptionUsage;
}

// Re-export type guards for runtime type checking
export const {
    isAPIError,
    isAPIResponse,
    isPaginationParams,
    isPaginatedResponse,
    isRateLimitInfo
} = api;

export const {
    isDrillPrompt,
    isDrillAttempt,
    isDrillEvaluation,
    isDrillResponse
} = drills;

export const {
    isSubscriptionPlan,
    isSubscriptionFeature,
    isSubscriptionLimits,
    isSubscription,
    isSubscriptionUsage
} = subscription;

export const {
    isUserProfile,
    isUserProgress,
    isUser
} = user;