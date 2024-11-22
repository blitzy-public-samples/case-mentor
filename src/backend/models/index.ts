/**
 * Human Tasks:
 * 1. Ensure all model classes have proper database tables and indexes configured
 * 2. Set up monitoring for model operation performance metrics
 * 3. Configure proper error tracking for model operations
 * 4. Review and adjust database connection pool settings based on model usage patterns
 * 5. Set up automated testing for model class integrations
 */

// Import model classes from their respective files
import { DrillAttemptModel } from './DrillAttempt';
import { Feedback } from './Feedback';
import { SimulationAttempt } from './SimulationAttempt';
import { SubscriptionModel } from './Subscription';
import { UserModel } from './User';

/**
 * Requirement: Core Features - Centralizes access to models for Practice Drills, 
 * McKinsey Simulation, User Management, and Subscription System
 * Location: 3. SCOPE/Core Features
 */
export {
    DrillAttemptModel,
    Feedback,
    SimulationAttempt,
    SubscriptionModel,
    UserModel
};

/**
 * Requirement: Data Storage - Provides unified access to database models for 
 * Users & Profiles, Drill Attempts & Results, Simulation Data, and Subscription Status
 * Location: 5. SYSTEM ARCHITECTURE/5.2 Component Details/Database Layer
 * 
 * This central export file serves as the unified entry point for all database models
 * in the Case Interview Practice Platform backend. It consolidates access to:
 * 
 * - DrillAttemptModel: For managing practice drill attempts and evaluations
 * - Feedback: For handling AI-generated feedback and evaluations
 * - SimulationAttempt: For managing McKinsey ecosystem simulation attempts
 * - SubscriptionModel: For handling user subscriptions and access control
 * - UserModel: For managing user data, profiles, and authentication
 */

// Type re-exports for convenience
export type {
    DrillAttempt,
    DrillEvaluation
} from '../types/drills';

export type {
    DrillResult,
    DrillMetrics
} from '../lib/drills/types';

export type {
    SimulationState,
    SimulationResult,
    SimulationResponse
} from '../types/simulation';

export type {
    User,
    UserProfile,
    UserSubscriptionTier,
    UserSubscriptionStatus
} from '../types/user';

export type {
    Subscription,
    SubscriptionPlan,
    SubscriptionFeature,
    SubscriptionLimits
} from '../types/subscription';