// @package @jest/globals ^29.0.0
// @package jest-mock-extended ^3.0.0

import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';
import { UserService } from '../../services/UserService';
import { User, UserProfile, UserSubscriptionTier, UserSubscriptionStatus } from '../../types/user';

/**
 * Human Tasks:
 * 1. Configure test database with proper test data
 * 2. Set up test environment variables for authentication
 * 3. Configure test coverage thresholds in Jest config
 * 4. Set up CI pipeline for automated test execution
 * 5. Implement proper test data cleanup procedures
 */

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/Subscription');
jest.mock('../../utils/database');
jest.mock('../../utils/validation');

// Test data
const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    profile: {
        firstName: 'Test',
        lastName: 'User',
        targetFirm: 'Test Firm',
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

const mockProfile: UserProfile = {
    firstName: 'Updated',
    lastName: 'User',
    targetFirm: 'Updated Firm',
    interviewDate: new Date('2024-02-01'),
    preparationLevel: 'ADVANCED',
    avatarUrl: null
};

describe('UserService', () => {
    let userService: UserService;
    let mockUserModel: any;
    let mockSubscriptionModel: any;
    let mockValidation: any;
    let mockDatabase: any;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Initialize mocks
        mockUserModel = mockDeep<typeof import('../../models/User')>();
        mockSubscriptionModel = mockDeep<typeof import('../../models/Subscription')>();
        mockValidation = mockDeep<typeof import('../../utils/validation')>();
        mockDatabase = mockDeep<typeof import('../../utils/database')>();

        // Initialize service
        userService = new UserService();
    });

    // Requirement: User Management - Profile customization, progress tracking
    test('registerUser should create user with profile and free subscription', async () => {
        // Mock successful validation
        mockValidation.validateUserProfile.mockResolvedValue(true);

        // Mock successful user creation
        mockUserModel.createUser.mockResolvedValue(mockUser);

        // Mock successful subscription creation
        mockSubscriptionModel.createSubscription.mockResolvedValue({
            id: 'sub_123',
            userId: mockUser.id,
            planId: UserSubscriptionTier.FREE,
            status: UserSubscriptionStatus.ACTIVE
        });

        // Mock transaction
        mockDatabase.withTransaction.mockImplementation((callback) => callback());

        const result = await userService.registerUser({
            email: 'test@example.com',
            password: 'Test123!',
            profile: mockUser.profile
        });

        expect(result).toEqual(mockUser);
        expect(mockValidation.validateUserProfile).toHaveBeenCalledWith(mockUser.profile);
        expect(mockUserModel.createUser).toHaveBeenCalled();
        expect(mockSubscriptionModel.createSubscription).toHaveBeenCalled();
        expect(mockDatabase.withTransaction).toHaveBeenCalled();
    });

    // Requirement: Data Security - Secure handling of user data and credentials
    test('authenticateUser should validate credentials and return user with subscription', async () => {
        // Mock successful authentication
        mockUserModel.authenticateUser.mockResolvedValue(mockUser);

        // Mock subscription retrieval
        mockSubscriptionModel.findByUserId.mockResolvedValue({
            planId: UserSubscriptionTier.FREE,
            status: UserSubscriptionStatus.ACTIVE
        });

        const result = await userService.authenticateUser('test@example.com', 'Test123!');

        expect(result).toEqual(mockUser);
        expect(mockUserModel.authenticateUser).toHaveBeenCalledWith('test@example.com', 'Test123!');
        expect(mockSubscriptionModel.findByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    // Requirement: User Management - Profile customization
    test('updateProfile should validate and update user profile', async () => {
        // Mock successful validation
        mockValidation.validateUserProfile.mockResolvedValue(true);

        // Mock successful profile update
        mockUserModel.updateUserProfile.mockResolvedValue({
            ...mockUser,
            profile: mockProfile
        });

        const result = await userService.updateProfile(mockUser.id, mockProfile);

        expect(result.profile).toEqual(mockProfile);
        expect(mockValidation.validateUserProfile).toHaveBeenCalledWith(mockProfile);
        expect(mockUserModel.updateUserProfile).toHaveBeenCalledWith(mockUser.id, mockProfile);
    });

    // Requirement: User Management - Progress tracking, performance analytics
    test('getUserProgress should validate subscription and return progress', async () => {
        // Mock user existence check
        mockUserModel.getUserById.mockResolvedValue(mockUser);

        // Mock subscription check
        mockSubscriptionModel.findByUserId.mockResolvedValue({
            planId: UserSubscriptionTier.FREE,
            status: UserSubscriptionStatus.ACTIVE
        });

        // Mock usage check
        mockSubscriptionModel.checkUsage.mockResolvedValue(true);

        // Mock progress metrics queries
        mockDatabase.executeQuery.mockResolvedValueOnce({
            completed: 10,
            success_rate: 75
        }).mockResolvedValueOnce({
            completed: 5,
            success_rate: 80
        }).mockResolvedValueOnce({
            'MARKET_SIZING': 85,
            'CASE_MATH': 70
        });

        const result = await userService.getUserProgress(mockUser.id);

        expect(result).toMatchObject({
            userId: mockUser.id,
            drillsCompleted: 10,
            drillsSuccessRate: 75,
            simulationsCompleted: 5,
            simulationsSuccessRate: 80,
            skillLevels: {
                'MARKET_SIZING': 85,
                'CASE_MATH': 70
            }
        });
        expect(mockUserModel.getUserById).toHaveBeenCalledWith(mockUser.id);
        expect(mockSubscriptionModel.findByUserId).toHaveBeenCalledWith(mockUser.id);
        expect(mockSubscriptionModel.checkUsage).toHaveBeenCalledWith('progress_tracking');
    });

    // Requirement: Subscription System - Tiered access control
    test('updateSubscription should update user subscription with transaction', async () => {
        // Mock successful subscription update
        mockUserModel.updateSubscription.mockResolvedValue({
            ...mockUser,
            subscriptionTier: UserSubscriptionTier.PREMIUM,
            subscriptionStatus: UserSubscriptionStatus.ACTIVE
        });

        // Mock subscription details update
        mockSubscriptionModel.updateSubscriptionDetails.mockResolvedValue({
            planId: UserSubscriptionTier.PREMIUM,
            status: UserSubscriptionStatus.ACTIVE
        });

        // Mock transaction
        mockDatabase.withTransaction.mockImplementation((callback) => callback());

        const result = await userService.updateSubscription(mockUser.id, {
            tier: UserSubscriptionTier.PREMIUM,
            status: UserSubscriptionStatus.ACTIVE
        });

        expect(result.subscriptionTier).toBe(UserSubscriptionTier.PREMIUM);
        expect(result.subscriptionStatus).toBe(UserSubscriptionStatus.ACTIVE);
        expect(mockUserModel.updateSubscription).toHaveBeenCalled();
        expect(mockSubscriptionModel.updateSubscriptionDetails).toHaveBeenCalled();
        expect(mockDatabase.withTransaction).toHaveBeenCalled();
    });
});