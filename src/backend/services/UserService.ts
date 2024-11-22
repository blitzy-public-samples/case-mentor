// @package @supabase/supabase-js ^2.38.0

/**
 * Human Tasks:
 * 1. Configure proper monitoring for failed authentication attempts
 * 2. Set up alerts for subscription status changes
 * 3. Implement user data backup procedures
 * 4. Configure proper logging with PII redaction
 * 5. Set up automated subscription renewal notifications
 */

import { UserModel } from '../models/User';
import { create as createSubscription, findByUserId } from '../models/Subscription';
import { executeQuery, withTransaction } from '../utils/database';
import { validateUserProfile } from '../utils/validation';
import { 
    User, 
    UserProfile, 
    UserSubscriptionTier, 
    UserSubscriptionStatus, 
    UserProgress 
} from '../types/user';

/**
 * Service class for handling user-related business logic and operations
 * Addresses requirements:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.2 Data Security)
 */
export class UserService {
    private userModel: UserModel;

    constructor() {
        this.userModel = new UserModel();
    }

    /**
     * Registers a new user with profile and subscription within a transaction
     * Addresses requirement: User Management - Profile customization
     */
    public async registerUser(registrationData: { 
        email: string; 
        password: string; 
        profile: UserProfile 
    }): Promise<User> {
        // Validate user profile data
        await validateUserProfile(registrationData.profile);

        return await withTransaction(async () => {
            // Create user with profile
            const user = await this.userModel.createUser(registrationData);

            // Create default subscription
            await createSubscription({
                id: crypto.randomUUID(),
                userId: user.id,
                planId: 'free_tier',
                status: UserSubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                cancelAtPeriodEnd: false,
                stripeSubscriptionId: '',
                stripeCustomerId: ''
            });

            return user;
        });
    }

    /**
     * Authenticates user credentials and returns user data with subscription
     * Addresses requirement: Data Security - Secure handling of user data and credentials
     */
    public async authenticateUser(email: string, password: string): Promise<User | null> {
        // Authenticate user
        const user = await this.userModel.authenticateUser(email, password);
        if (!user) {
            return null;
        }

        // Load active subscription
        const subscription = await findByUserId(user.id);
        if (subscription) {
            user.subscriptionTier = subscription.planId as UserSubscriptionTier;
            user.subscriptionStatus = subscription.status;
        }

        return user;
    }

    /**
     * Updates user profile information with validation
     * Addresses requirement: User Management - Profile customization
     */
    public async updateProfile(userId: string, profileData: UserProfile): Promise<User> {
        // Validate profile data
        await validateUserProfile(profileData);

        // Update user profile
        return await this.userModel.updateUserProfile(userId, profileData);
    }

    /**
     * Retrieves user's practice progress and analytics with subscription validation
     * Addresses requirement: User Management - Progress tracking, performance analytics
     */
    public async getUserProgress(userId: string): Promise<UserProgress> {
        // Verify user exists
        const user = await this.userModel.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check subscription usage limits
        const subscription = await findByUserId(userId);
        if (!subscription || !(await subscription.checkUsage('progress_tracking'))) {
            throw new Error('Usage limit exceeded or invalid subscription');
        }

        // Query drill attempts and calculate metrics
        const drillMetrics = await executeQuery<{
            completed: number;
            success_rate: number;
        }>(`
            SELECT 
                COUNT(*) as completed,
                AVG(CASE WHEN score >= 70 THEN 1 ELSE 0 END) * 100 as success_rate
            FROM drill_attempts 
            WHERE user_id = $1 
            AND completed_at IS NOT NULL
        `, [userId]);

        // Query simulation attempts
        const simulationMetrics = await executeQuery<{
            completed: number;
            success_rate: number;
        }>(`
            SELECT 
                COUNT(*) as completed,
                AVG(CASE WHEN success = true THEN 1 ELSE 0 END) * 100 as success_rate
            FROM simulation_attempts 
            WHERE user_id = $1 
            AND completed_at IS NOT NULL
        `, [userId]);

        // Calculate skill levels
        const skillLevels = await executeQuery<Record<string, number>>(`
            SELECT 
                skill_type,
                AVG(score) as level
            FROM skill_assessments 
            WHERE user_id = $1 
            GROUP BY skill_type
        `, [userId]);

        return {
            userId,
            drillsCompleted: drillMetrics.completed,
            drillsSuccessRate: drillMetrics.success_rate,
            simulationsCompleted: simulationMetrics.completed,
            simulationsSuccessRate: simulationMetrics.success_rate,
            skillLevels,
            lastUpdated: new Date()
        };
    }

    /**
     * Updates user's subscription tier with transaction management
     * Addresses requirement: Subscription System - Tiered access control
     */
    public async updateSubscription(userId: string, subscriptionData: {
        tier: UserSubscriptionTier;
        status: UserSubscriptionStatus;
    }): Promise<User> {
        return await withTransaction(async () => {
            // Update user subscription tier
            const user = await this.userModel.updateSubscription(userId, subscriptionData);

            // Update subscription details
            const subscription = await findByUserId(userId);
            if (subscription) {
                await subscription.update({
                    planId: subscriptionData.tier,
                    status: subscriptionData.status,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    cancelAtPeriodEnd: false
                });
            }

            return user;
        });
    }
}