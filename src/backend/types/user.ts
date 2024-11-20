// @package zod ^3.22.0
import { z } from 'zod';

/**
 * Human Tasks:
 * 1. Ensure PostgreSQL database has appropriate enums created for UserSubscriptionTier, 
 *    UserSubscriptionStatus, and UserPreparationLevel
 * 2. Configure Stripe webhook handlers to update subscription status appropriately
 * 3. Set up avatar storage bucket in Supabase for profile images
 * 4. Implement proper date handling for timezone consistency across the platform
 */

// Requirement: User Management - Profile customization
export interface UserProfile {
    firstName: string;
    lastName: string;
    targetFirm: string;
    interviewDate: Date | null;
    preparationLevel: UserPreparationLevel;
    avatarUrl: string | null;
}

// Requirement: User Management - Progress tracking
export interface UserProgress {
    userId: string;
    drillsCompleted: number;
    drillsSuccessRate: number;
    simulationsCompleted: number;
    simulationsSuccessRate: number;
    skillLevels: Record<string, number>;
    lastUpdated: Date;
}

// Requirement: User Management - Performance analytics
export enum UserPreparationLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED'
}

// Requirement: Subscription System - Tiered access control
export enum UserSubscriptionTier {
    FREE = 'FREE',
    BASIC = 'BASIC',
    PREMIUM = 'PREMIUM'
}

// Requirement: Subscription System - Payment processing integration
export enum UserSubscriptionStatus {
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELED = 'CANCELED',
    EXPIRED = 'EXPIRED'
}

// Requirement: User Management - Core user data structure
export interface User {
    id: string;
    email: string;
    profile: UserProfile;
    subscriptionTier: UserSubscriptionTier;
    subscriptionStatus: UserSubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
}

// Zod schemas for runtime validation

export const UserProfileSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    targetFirm: z.string().min(1).max(100),
    interviewDate: z.date().nullable(),
    preparationLevel: z.nativeEnum(UserPreparationLevel),
    avatarUrl: z.string().url().nullable()
});

export const UserProgressSchema = z.object({
    userId: z.string().uuid(),
    drillsCompleted: z.number().int().min(0),
    drillsSuccessRate: z.number().min(0).max(100),
    simulationsCompleted: z.number().int().min(0),
    simulationsSuccessRate: z.number().min(0).max(100),
    skillLevels: z.record(z.string(), z.number().min(0).max(100)),
    lastUpdated: z.date()
});

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    profile: UserProfileSchema,
    subscriptionTier: z.nativeEnum(UserSubscriptionTier),
    subscriptionStatus: z.nativeEnum(UserSubscriptionStatus),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date()
});

// Type guards for runtime type checking
export const isUserProfile = (value: unknown): value is UserProfile => {
    return UserProfileSchema.safeParse(value).success;
};

export const isUserProgress = (value: unknown): value is UserProgress => {
    return UserProgressSchema.safeParse(value).success;
};

export const isUser = (value: unknown): value is User => {
    return UserSchema.safeParse(value).success;
};