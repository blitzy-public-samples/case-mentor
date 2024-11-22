/**
 * Human Tasks:
 * 1. Configure monitoring for service initialization and dependency management
 * 2. Set up proper error tracking for service method failures
 * 3. Implement service health checks and readiness probes
 * 4. Review and adjust service initialization order if needed
 */

// Import service classes from their respective modules
import { DrillService } from './DrillService';
import { FeedbackService } from './FeedbackService';
import { SimulationService } from './SimulationService';
import { SubscriptionService } from './SubscriptionService';
import { UserService } from './UserService';
import { OpenAIService } from '../lib/openai';
import { supabaseClient } from '../config/database';
import { default as Redis } from '../lib/cache/redis';

/**
 * Central service module that aggregates and exports all core business logic services
 * Requirement: Core Services - AI evaluation, subscription management, progress tracking
 */
export {
    DrillService,
    FeedbackService,
    SimulationService,
    SubscriptionService,
    UserService
};

/**
 * Service initialization and dependency management
 * Requirement: System Architecture - Service layer organization with proper dependency management
 */
export async function initializeServices(): Promise<{
    drillService: DrillService;
    feedbackService: FeedbackService;
    simulationService: SimulationService;
    subscriptionService: SubscriptionService;
    userService: UserService;
}> {
    try {
        // Initialize Redis client
        const cache = await Redis.connect();

        // Initialize services in dependency order
        const subscriptionService = new SubscriptionService();
        const userService = new UserService();
        const feedbackService = new FeedbackService(new OpenAIService());
        const simulationService = new SimulationService();
        
        // Initialize drill service with dependencies
        const drillService = new DrillService(
            supabaseClient,
            cache
        );

        // Validate service initialization
        await validateServices({
            drillService,
            feedbackService,
            simulationService,
            subscriptionService,
            userService
        });

        return {
            drillService,
            feedbackService,
            simulationService,
            subscriptionService,
            userService
        };
    } catch (error) {
        throw new Error(`Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validates that all services are properly initialized
 * Requirement: System Architecture - Service layer organization
 */
async function validateServices(services: {
    drillService: DrillService;
    feedbackService: FeedbackService;
    simulationService: SimulationService;
    subscriptionService: SubscriptionService;
    userService: UserService;
}): Promise<void> {
    type ServiceValidation = {
        service: DrillService | FeedbackService | SimulationService | SubscriptionService | UserService;
        methods: string[];
    };

    // Validate each service has required methods
    const serviceValidations: ServiceValidation[] = [
        {
            service: services.drillService,
            methods: ['getDrillById', 'listDrills', 'startDrillAttempt', 'submitDrillResponse', 'getUserDrillHistory']
        },
        {
            service: services.feedbackService,
            methods: ['generateFeedback', 'getFeedback', 'getAttemptFeedback', 'updateFeedback']
        },
        {
            service: services.simulationService,
            methods: ['startSimulation', 'updateSpecies', 'updateEnvironment', 'executeTimeStep', 'completeSimulation']
        },
        {
            service: services.subscriptionService,
            methods: ['createSubscription', 'updateSubscription', 'cancelSubscription', 'getSubscriptionUsage']
        },
        {
            service: services.userService,
            methods: ['registerUser', 'authenticateUser', 'updateProfile', 'getUserProgress', 'updateSubscription']
        }
    ];

    for (const validation of serviceValidations) {
        for (const method of validation.methods) {
            if (typeof (validation.service as any)[method] !== 'function') {
                throw new Error(`Service validation failed: ${method} not found`);
            }
        }
    }
}

/**
 * Type definitions for service initialization options
 * Requirement: System Architecture - Type-safe service configuration
 */
export interface ServiceInitializationOptions {
    databaseUrl: string;
    cacheUrl: string;
    openaiApiKey: string;
    stripeSecretKey: string;
    environment: 'development' | 'staging' | 'production';
}

/**
 * Service initialization with configuration
 * Requirement: System Architecture - Configurable service initialization
 */
export async function initializeServicesWithConfig(
    options: ServiceInitializationOptions
): Promise<ReturnType<typeof initializeServices>> {
    // Validate configuration
    if (!options.databaseUrl || !options.cacheUrl || !options.openaiApiKey || !options.stripeSecretKey) {
        throw new Error('Invalid service configuration: Missing required options');
    }

    // Initialize services with configuration
    process.env.SUPABASE_URL = options.databaseUrl;
    process.env.REDIS_URL = options.cacheUrl;
    process.env.OPENAI_API_KEY = options.openaiApiKey;
    process.env.STRIPE_SECRET_KEY = options.stripeSecretKey;

    return initializeServices();
}