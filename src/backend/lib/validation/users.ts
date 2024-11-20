// @package zod ^3.22.0
import { z } from 'zod';
import { 
  User, 
  UserProfile, 
  UserSubscriptionTier, 
  UserSubscriptionStatus 
} from '../../types/user';
import { validateUserProfile } from '../../utils/validation';
import { AUTH_CONSTANTS } from '../../config/constants';

/**
 * Human Tasks:
 * 1. Configure password hashing settings in environment variables
 * 2. Set up email verification service integration
 * 3. Configure subscription tier change webhooks with payment provider
 * 4. Review and adjust validation rules periodically based on user feedback
 */

// Requirement: Security Controls - Input validation for user data
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  profile: z.object({
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters'),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters'),
    targetFirm: z.string()
      .min(2, 'Target firm must be at least 2 characters')
      .max(100, 'Target firm must not exceed 100 characters'),
    interviewDate: z.date().nullable(),
    preparationLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  })
});

// Requirement: User Management - Profile customization validation
export const userProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .optional(),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .optional(),
  targetFirm: z.string()
    .min(2, 'Target firm must be at least 2 characters')
    .max(100, 'Target firm must not exceed 100 characters')
    .optional(),
  interviewDate: z.date().nullable().optional(),
  preparationLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional()
}).refine(data => 
  Object.keys(data).length > 0, 
  'At least one profile field must be updated'
);

// Requirement: Security Controls - Subscription validation
export const subscriptionUpdateSchema = z.object({
  tier: z.nativeEnum(UserSubscriptionTier),
  status: z.nativeEnum(UserSubscriptionStatus),
  paymentInfo: z.object({
    provider: z.enum(['stripe', 'paypal']),
    token: z.string(),
    last4: z.string().length(4).optional(),
    expiryMonth: z.number().min(1).max(12).optional(),
    expiryYear: z.number().min(new Date().getFullYear()).optional()
  }).optional()
}).refine(data => {
  if (data.tier !== UserSubscriptionTier.FREE) {
    return data.paymentInfo !== undefined;
  }
  return true;
}, 'Payment information is required for paid subscription tiers');

// Requirement: Security Controls - User registration validation
export async function validateUserRegistration(registrationData: unknown): Promise<boolean> {
  try {
    const validatedData = await userRegistrationSchema.parseAsync(registrationData);
    
    // Additional validation rules
    const emailDomain = validatedData.email.split('@')[1];
    if (emailDomain.endsWith('.test') || emailDomain.endsWith('.example')) {
      throw new Error('Test email domains are not allowed');
    }

    if (validatedData.profile.interviewDate) {
      const today = new Date();
      const interviewDate = new Date(validatedData.profile.interviewDate);
      if (interviewDate < today) {
        throw new Error('Interview date cannot be in the past');
      }
    }

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Requirement: User Management - Profile update validation
export async function validateProfileUpdate(profileData: unknown): Promise<boolean> {
  try {
    const validatedData = await userProfileSchema.parseAsync(profileData);
    
    // Additional validation using utility function
    await validateUserProfile({
      ...validatedData,
      subscriptionTier: UserSubscriptionTier.FREE // Default value for validation
    });

    if (validatedData.interviewDate) {
      const today = new Date();
      const interviewDate = new Date(validatedData.interviewDate);
      if (interviewDate < today) {
        throw new Error('Interview date cannot be in the past');
      }
    }

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Profile validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Requirement: Security Controls - Subscription change validation
export async function validateSubscriptionUpdate(subscriptionData: unknown): Promise<boolean> {
  try {
    const validatedData = await subscriptionUpdateSchema.parseAsync(subscriptionData);
    
    // Additional validation rules for subscription changes
    if (validatedData.status === UserSubscriptionStatus.ACTIVE) {
      if (!validatedData.paymentInfo && validatedData.tier !== UserSubscriptionTier.FREE) {
        throw new Error('Active paid subscriptions require payment information');
      }
    }

    // Token expiry validation for subscription changes
    if (validatedData.paymentInfo?.expiryYear && validatedData.paymentInfo?.expiryMonth) {
      const today = new Date();
      const expiry = new Date(
        validatedData.paymentInfo.expiryYear,
        validatedData.paymentInfo.expiryMonth - 1
      );
      
      if (expiry <= today) {
        throw new Error('Payment method has expired');
      }
    }

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Subscription validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}