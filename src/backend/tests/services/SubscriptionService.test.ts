// @package jest ^29.0.0
// @package stripe ^12.0.0

/**
 * Human Tasks:
 * 1. Configure test environment variables for Stripe test mode
 * 2. Set up test database with proper subscription tables
 * 3. Configure test webhook endpoints in Stripe dashboard
 * 4. Set up monitoring for test payment processing
 * 5. Ensure proper test data cleanup after test runs
 */

import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import { Stripe } from 'stripe';
import { 
    SubscriptionService,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getSubscriptionUsage,
    handleWebhook 
} from '../../services/SubscriptionService';
import { 
    SubscriptionModel,
    create,
    findById,
    findByUserId,
    update,
    cancel,
    checkUsage 
} from '../../models/Subscription';
import { stripeClient, SUBSCRIPTION_PRODUCTS } from '../../config/stripe';

// Mock dependencies
jest.mock('../../models/Subscription');
jest.mock('../../config/stripe', () => ({
    stripeClient: {
        customers: {
            create: jest.fn(),
            update: jest.fn()
        },
        subscriptions: {
            create: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn()
        },
        paymentMethods: {
            attach: jest.fn()
        }
    },
    SUBSCRIPTION_PRODUCTS: {
        FREE: {
            id: 'free-tier',
            stripeProductId: 'price_free',
            limits: {
                drillAttemptsPerDay: 10,
                simulationAttemptsPerDay: 2,
                apiRequestsPerHour: 5
            }
        },
        BASIC: {
            id: 'basic-tier',
            stripeProductId: 'price_basic',
            limits: {
                drillAttemptsPerDay: 50,
                simulationAttemptsPerDay: 10,
                apiRequestsPerHour: 25
            }
        },
        PREMIUM: {
            id: 'premium-tier',
            stripeProductId: 'price_premium',
            limits: {
                drillAttemptsPerDay: 200,
                simulationAttemptsPerDay: 50,
                apiRequestsPerHour: 100
            }
        }
    }
}));

describe('SubscriptionService', () => {
    let subscriptionService: SubscriptionService;
    const mockUserId = 'user-123';
    const mockSubscriptionId = 'sub-123';
    const mockCustomerId = 'cus-123';
    const mockPaymentMethodId = 'pm-123';

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        subscriptionService = new SubscriptionService();

        // Reset mock implementations
        (stripeClient.customers.create as jest.Mock).mockResolvedValue({ id: mockCustomerId });
        (stripeClient.subscriptions.create as jest.Mock).mockResolvedValue({
            id: mockSubscriptionId,
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
        });
        (create as jest.Mock).mockResolvedValue({
            id: mockSubscriptionId,
            userId: mockUserId,
            status: 'ACTIVE'
        });
    });

    // Requirement: Subscription System - Payment processing integration
    test('createSubscription should create Stripe customer and subscription', async () => {
        const planId = 'BASIC';
        
        await subscriptionService.createSubscription(mockUserId, planId, mockPaymentMethodId);

        expect(stripeClient.customers.create).toHaveBeenCalledWith({
            metadata: { userId: mockUserId }
        });

        expect(stripeClient.paymentMethods.attach).toHaveBeenCalledWith(
            mockPaymentMethodId,
            { customer: mockCustomerId }
        );

        expect(stripeClient.subscriptions.create).toHaveBeenCalledWith(
            expect.objectContaining({
                customer: mockCustomerId,
                items: [{ price: SUBSCRIPTION_PRODUCTS[planId].stripeProductId }],
                payment_behavior: 'default_incomplete'
            })
        );

        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: mockUserId,
                planId: planId,
                stripeSubscriptionId: mockSubscriptionId,
                stripeCustomerId: mockCustomerId,
                status: 'ACTIVE'
            })
        );
    });

    // Requirement: Subscription System - Account management
    test('updateSubscription should update subscription plan', async () => {
        const newPlanId = 'PREMIUM';
        const mockExistingSubscription = {
            id: mockSubscriptionId,
            planId: 'BASIC',
            stripeSubscriptionId: 'stripe-sub-123'
        };

        (findById as jest.Mock).mockResolvedValue(mockExistingSubscription);
        (update as jest.Mock).mockResolvedValue({
            ...mockExistingSubscription,
            planId: newPlanId
        });

        await subscriptionService.updateSubscription(mockSubscriptionId, { planId: newPlanId });

        expect(stripeClient.subscriptions.update).toHaveBeenCalledWith(
            mockExistingSubscription.stripeSubscriptionId,
            expect.objectContaining({
                items: [{
                    id: mockExistingSubscription.stripeSubscriptionId,
                    price: SUBSCRIPTION_PRODUCTS[newPlanId].stripeProductId
                }],
                proration_behavior: 'create_prorations'
            })
        );

        expect(update).toHaveBeenCalledWith(
            mockSubscriptionId,
            expect.objectContaining({ planId: newPlanId })
        );
    });

    // Requirement: Subscription System - Account management
    test('cancelSubscription should handle immediate and end-of-period cancellation', async () => {
        const mockSubscription = {
            id: mockSubscriptionId,
            stripeSubscriptionId: 'stripe-sub-123'
        };

        (findById as jest.Mock).mockResolvedValue(mockSubscription);

        // Test immediate cancellation
        await subscriptionService.cancelSubscription(mockSubscriptionId, true);

        expect(stripeClient.subscriptions.cancel).toHaveBeenCalledWith(
            mockSubscription.stripeSubscriptionId
        );
        expect(cancel).toHaveBeenCalledWith(mockSubscriptionId, true);

        // Test end-of-period cancellation
        await subscriptionService.cancelSubscription(mockSubscriptionId, false);

        expect(stripeClient.subscriptions.update).toHaveBeenCalledWith(
            mockSubscription.stripeSubscriptionId,
            { cancel_at_period_end: true }
        );
        expect(cancel).toHaveBeenCalledWith(mockSubscriptionId, false);
    });

    // Requirement: Rate Limiting - Different API rate limits based on subscription tier
    test('getSubscriptionUsage should return correct usage data', async () => {
        const mockSubscription = {
            id: mockSubscriptionId,
            planId: 'BASIC',
            userId: mockUserId
        };

        const mockUsage = {
            drillAttempts: 25,
            simulationAttempts: 5,
            apiRequests: 15
        };

        (findById as jest.Mock).mockResolvedValue(mockSubscription);
        (checkUsage as jest.Mock).mockResolvedValue(mockUsage);

        const usage = await subscriptionService.getSubscriptionUsage(mockSubscriptionId);

        expect(usage).toEqual({
            subscriptionId: mockSubscriptionId,
            drillAttempts: mockUsage.drillAttempts,
            simulationAttempts: mockUsage.simulationAttempts,
            apiRequests: mockUsage.apiRequests,
            limits: SUBSCRIPTION_PRODUCTS.BASIC.limits,
            period: expect.any(Date)
        });
    });

    // Requirement: Subscription System - Payment processing
    test('handleWebhook should process Stripe webhook events correctly', async () => {
        const mockEvent: Stripe.Event = {
            id: 'evt-123',
            type: 'customer.subscription.updated',
            data: {
                object: {
                    id: mockSubscriptionId,
                    customer: mockCustomerId,
                    status: 'active',
                    current_period_start: Math.floor(Date.now() / 1000),
                    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                    cancel_at_period_end: false
                }
            }
        } as Stripe.Event;

        await subscriptionService.handleWebhook(mockEvent);

        expect(update).toHaveBeenCalledWith(
            mockSubscriptionId,
            expect.objectContaining({
                status: 'ACTIVE',
                currentPeriodStart: expect.any(Date),
                currentPeriodEnd: expect.any(Date),
                cancelAtPeriodEnd: false
            })
        );

        // Test subscription deletion event
        const deletionEvent: Stripe.Event = {
            ...mockEvent,
            type: 'customer.subscription.deleted'
        };

        await subscriptionService.handleWebhook(deletionEvent);

        expect(cancel).toHaveBeenCalledWith(mockSubscriptionId, true);

        // Test payment failure event
        const paymentFailureEvent: Stripe.Event = {
            ...mockEvent,
            type: 'invoice.payment_failed',
            data: {
                object: {
                    subscription: mockSubscriptionId
                }
            }
        } as Stripe.Event;

        await subscriptionService.handleWebhook(paymentFailureEvent);

        expect(update).toHaveBeenCalledWith(
            mockSubscriptionId,
            expect.objectContaining({ status: 'PAST_DUE' })
        );
    });
});