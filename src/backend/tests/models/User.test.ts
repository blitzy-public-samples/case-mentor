// @package @jest/globals ^29.0.0
// @package @supabase/supabase-js ^2.38.0

/**
 * Human Tasks:
 * 1. Configure test database with appropriate test data isolation
 * 2. Set up CI/CD pipeline to run tests before deployment
 * 3. Configure test coverage reporting and thresholds
 * 4. Set up monitoring for test execution times
 * 5. Implement automated cleanup of test data
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { UserModel, createUser, getUserById, updateUserProfile, authenticateUser, updateSubscription } from '../../models/User';
import { User, UserSubscriptionTier, UserSubscriptionStatus } from '../../types/user';
import { supabaseClient } from '../../config/database';

// Mock the database client
jest.mock('../../config/database', () => ({
    supabaseClient: {
        from: jest.fn(),
    }
}));

describe('UserModel', () => {
    let userModel: UserModel;
    const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        profile: {
            firstName: 'Test',
            lastName: 'User',
            targetFirm: 'McKinsey',
            interviewDate: new Date('2024-01-01'),
            preparationLevel: 'INTERMEDIATE',
            avatarUrl: null
        },
        subscriptionTier: UserSubscriptionTier.FREE,
        subscriptionStatus: UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Initialize UserModel instance
        userModel = new UserModel();
    });

    afterEach(() => {
        // Clean up after each test
        jest.resetAllMocks();
    });

    describe('createUser', () => {
        it('should create a new user with valid email, password and profile data', async () => {
            // Requirement: User Management - Profile customization
            const mockInsert = jest.fn().mockReturnValue({
                data: mockUser,
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.createUser({
                email: mockUser.email,
                password: 'SecurePass123!',
                profile: mockUser.profile
            });

            expect(result).toEqual(mockUser);
            expect(mockInsert).toHaveBeenCalledTimes(1);
        });

        it('should throw error for invalid email format', async () => {
            // Requirement: Data Security - Secure handling of user data
            const invalidEmail = 'invalid-email';
            
            await expect(userModel.createUser({
                email: invalidEmail,
                password: 'SecurePass123!',
                profile: mockUser.profile
            })).rejects.toThrow();
        });

        it('should initialize with FREE subscription tier', async () => {
            // Requirement: Subscription System - Tiered access control
            const mockInsert = jest.fn().mockReturnValue({
                data: mockUser,
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.createUser({
                email: mockUser.email,
                password: 'SecurePass123!',
                profile: mockUser.profile
            });

            expect(result.subscriptionTier).toBe(UserSubscriptionTier.FREE);
            expect(result.subscriptionStatus).toBe(UserSubscriptionStatus.ACTIVE);
        });
    });

    describe('getUserById', () => {
        it('should return complete user object when found', async () => {
            // Requirement: User Management - Profile customization
            const mockSelect = jest.fn().mockReturnValue({
                data: mockUser,
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                select: mockSelect,
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.getUserById(mockUser.id);
            expect(result).toEqual(mockUser);
        });

        it('should return null when user ID does not exist', async () => {
            // Requirement: Data Security - Secure handling of user data
            const mockSelect = jest.fn().mockReturnValue({
                data: null,
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                select: mockSelect,
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.getUserById('non-existent-id');
            expect(result).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        it('should update user profile with valid profile data', async () => {
            // Requirement: User Management - Profile customization
            const updatedProfile = {
                ...mockUser.profile,
                firstName: 'Updated',
                lastName: 'Name'
            };

            const mockUpdate = jest.fn().mockReturnValue({
                data: { ...mockUser, profile: updatedProfile },
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.updateUserProfile(mockUser.id, updatedProfile);
            expect(result.profile).toEqual(updatedProfile);
        });

        it('should maintain existing subscription data', async () => {
            // Requirement: Subscription System - Tiered access control
            const updatedProfile = {
                ...mockUser.profile,
                firstName: 'Updated'
            };

            const mockUpdate = jest.fn().mockReturnValue({
                data: { ...mockUser, profile: updatedProfile },
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.updateUserProfile(mockUser.id, updatedProfile);
            expect(result.subscriptionTier).toBe(mockUser.subscriptionTier);
            expect(result.subscriptionStatus).toBe(mockUser.subscriptionStatus);
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate user with correct email and password', async () => {
            // Requirement: Data Security - Secure handling of user credentials
            const mockSelect = jest.fn().mockReturnValue({
                data: mockUser,
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                select: mockSelect,
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnValue({ error: null })
            });

            const result = await userModel.authenticateUser(mockUser.email, 'SecurePass123!');
            expect(result).toEqual(mockUser);
        });

        it('should reject non-existent email', async () => {
            // Requirement: Data Security - Secure handling of user credentials
            const mockSelect = jest.fn().mockReturnValue({
                data: null,
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                select: mockSelect,
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.authenticateUser('nonexistent@example.com', 'SecurePass123!');
            expect(result).toBeNull();
        });
    });

    describe('updateSubscription', () => {
        it('should update subscription tier between FREE, BASIC, PREMIUM', async () => {
            // Requirement: Subscription System - Tiered access control
            const mockUpdate = jest.fn().mockReturnValue({
                data: { ...mockUser, subscriptionTier: UserSubscriptionTier.PREMIUM },
                error: null
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            const result = await userModel.updateSubscription(mockUser.id, {
                tier: UserSubscriptionTier.PREMIUM,
                status: UserSubscriptionStatus.ACTIVE
            });

            expect(result.subscriptionTier).toBe(UserSubscriptionTier.PREMIUM);
        });

        it('should throw error for invalid subscription status', async () => {
            // Requirement: Subscription System - Tiered access control
            const mockUpdate = jest.fn().mockReturnValue({
                data: null,
                error: { message: 'Invalid subscription status' }
            });

            (supabaseClient.from as jest.Mock).mockReturnValue({
                update: mockUpdate,
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            });

            await expect(userModel.updateSubscription(mockUser.id, {
                tier: UserSubscriptionTier.PREMIUM,
                status: 'INVALID_STATUS' as UserSubscriptionStatus
            })).rejects.toThrow();
        });
    });
});