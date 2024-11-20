// @package @supabase/supabase-js ^2.38.0

/**
 * Human Tasks:
 * 1. Configure proper password hashing parameters based on production hardware capabilities
 * 2. Set up monitoring for failed authentication attempts
 * 3. Implement user data backup and recovery procedures
 * 4. Configure proper logging for user operations with PII redaction
 * 5. Set up automated subscription status checks and notifications
 */

import { User, UserProfile, UserSubscriptionTier, UserSubscriptionStatus } from '../types/user';
import { validateUserProfile } from '../utils/validation';
import { hashPassword, verifyPassword } from '../utils/encryption';
import { supabaseClient } from '../config/database';

/**
 * Core User model class implementing user management functionality
 * Addresses requirements:
 * - User Management (3. SCOPE/Core Features/User Management)
 * - Subscription System (3. SCOPE/Core Features/Subscription System)
 * - Data Security (8. SECURITY CONSIDERATIONS/8.2 Data Security)
 */
export class UserModel {
    private dbClient;

    constructor() {
        this.dbClient = supabaseClient;
    }

    /**
     * Creates a new user with profile and encrypted credentials
     * Addresses requirement: User Management - Profile customization
     */
    async createUser(userData: { 
        email: string; 
        password: string; 
        profile: UserProfile 
    }): Promise<User> {
        // Validate user profile data
        await validateUserProfile(userData.profile);

        // Hash password securely
        const { hash, salt } = hashPassword(userData.password);

        // Create user record with default subscription settings
        const { data: user, error } = await this.dbClient
            .from('users')
            .insert({
                email: userData.email,
                password_hash: hash,
                password_salt: salt,
                profile: userData.profile,
                subscription_tier: UserSubscriptionTier.FREE,
                subscription_status: UserSubscriptionStatus.ACTIVE,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login_at: null
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }

        // Transform database record to User interface
        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : new Date()
        };
    }

    /**
     * Retrieves a user by their ID
     * Addresses requirement: User Management - Profile customization
     */
    async getUserById(userId: string): Promise<User | null> {
        const { data: user, error } = await this.dbClient
            .from('users')
            .select()
            .eq('id', userId)
            .single();

        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : new Date()
        };
    }

    /**
     * Updates a user's profile information
     * Addresses requirement: User Management - Profile customization
     */
    async updateUserProfile(userId: string, profileData: UserProfile): Promise<User> {
        // Validate updated profile data
        await validateUserProfile(profileData);

        const { data: user, error } = await this.dbClient
            .from('users')
            .update({
                profile: profileData,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update user profile: ${error.message}`);
        }

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : new Date()
        };
    }

    /**
     * Authenticates a user with email and password
     * Addresses requirement: Data Security - Secure handling of user data and credentials
     */
    async authenticateUser(email: string, password: string): Promise<User | null> {
        const { data: user, error } = await this.dbClient
            .from('users')
            .select()
            .eq('email', email)
            .single();

        if (error || !user) {
            return null;
        }

        // Verify password using secure comparison
        const isValid = verifyPassword(password, user.password_hash, user.password_salt);
        if (!isValid) {
            return null;
        }

        // Update last login timestamp
        await this.dbClient
            .from('users')
            .update({
                last_login_at: new Date().toISOString()
            })
            .eq('id', user.id);

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: new Date()
        };
    }

    /**
     * Updates a user's subscription tier and status
     * Addresses requirement: Subscription System - Tiered access control
     */
    async updateSubscription(userId: string, subscriptionData: {
        tier: UserSubscriptionTier;
        status: UserSubscriptionStatus;
    }): Promise<User> {
        const { data: user, error } = await this.dbClient
            .from('users')
            .update({
                subscription_tier: subscriptionData.tier,
                subscription_status: subscriptionData.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update subscription: ${error.message}`);
        }

        return {
            id: user.id,
            email: user.email,
            profile: user.profile,
            subscriptionTier: user.subscription_tier,
            subscriptionStatus: user.subscription_status,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : new Date()
        };
    }
}