// @jest/globals ^29.0.0
// stripe-mock ^2.0.0

import { describe, expect, beforeEach, afterEach, it } from '@jest/globals';
import StripeMock from 'stripe-mock';
import { SubscriptionModel } from '../../models/Subscription';
import { Subscription, UserSubscriptionStatus } from '../../types/subscription';

/**
 * Human Tasks:
 * 1. Configure Stripe test API keys in test environment
 * 2. Set up test database with required tables and schemas
 * 3. Configure test data seeding for subscription plans
 * 4. Set up monitoring for test coverage metrics
 * 5. Configure CI/CD pipeline test stages
 */

describe('SubscriptionModel', () => {
  let stripeMock: StripeMock;
  let testSubscription: Subscription;

  beforeEach(async () => {
    // Initialize Stripe mock
    stripeMock = new StripeMock();
    await stripeMock.start();

    // Set up test data
    testSubscription = {
      id: 'test-sub-123',
      userId: 'test-user-123',
      planId: 'test-plan-123',
      status: UserSubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: 'test-stripe-sub-123',
      stripeCustomerId: 'test-stripe-customer-123'
    };

    // Clear database tables
    await executeQuery('TRUNCATE TABLE subscriptions CASCADE');
    await executeQuery('TRUNCATE TABLE usage_logs CASCADE');
  });

  afterEach(async () => {
    await stripeMock.stop();
  });

  // Requirement: Subscription System - Payment processing integration
  describe('create', () => {
    it('should create a new subscription with Stripe integration', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);

      expect(subscription).toBeInstanceOf(SubscriptionModel);
      expect(subscription.id).toBe(testSubscription.id);
      expect(subscription.status).toBe(UserSubscriptionStatus.ACTIVE);
      expect(subscription.stripeSubscriptionId).toBeDefined();
    });

    it('should throw error when Stripe subscription creation fails', async () => {
      stripeMock.setError('subscriptions.create', new Error('Stripe error'));
      
      await expect(SubscriptionModel.create(testSubscription))
        .rejects
        .toThrow('Failed to create subscription');
    });

    it('should prevent duplicate subscriptions for the same user', async () => {
      await SubscriptionModel.create(testSubscription);
      
      await expect(SubscriptionModel.create(testSubscription))
        .rejects
        .toThrow('Failed to create subscription');
    });
  });

  describe('findById', () => {
    it('should retrieve subscription by ID', async () => {
      const created = await SubscriptionModel.create(testSubscription);
      const found = await SubscriptionModel.findById(created.id);

      expect(found).toBeInstanceOf(SubscriptionModel);
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent subscription ID', async () => {
      const found = await SubscriptionModel.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Simulate database error
      jest.spyOn(global, 'executeQuery').mockRejectedValueOnce(new Error('DB error'));
      
      await expect(SubscriptionModel.findById(testSubscription.id))
        .rejects
        .toThrow('Failed to find subscription');
    });
  });

  describe('findByUserId', () => {
    it('should retrieve active subscription for user', async () => {
      const created = await SubscriptionModel.create(testSubscription);
      const found = await SubscriptionModel.findByUserId(created.userId);

      expect(found).toBeInstanceOf(SubscriptionModel);
      expect(found?.userId).toBe(created.userId);
      expect(found?.status).toBe(UserSubscriptionStatus.ACTIVE);
    });

    it('should not retrieve canceled subscriptions', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      await subscription.cancel(true);

      const found = await SubscriptionModel.findByUserId(subscription.userId);
      expect(found).toBeNull();
    });
  });

  // Requirement: Subscription System - Account management
  describe('update', () => {
    it('should update subscription plan with Stripe synchronization', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      const updatedPlan = 'new-plan-id';

      const updated = await subscription.update({ planId: updatedPlan });

      expect(updated.planId).toBe(updatedPlan);
      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        subscription.stripeSubscriptionId,
        expect.objectContaining({ items: [{ price: updatedPlan }] })
      );
    });

    it('should handle Stripe update failures', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      stripeMock.setError('subscriptions.update', new Error('Stripe error'));

      await expect(subscription.update({ planId: 'new-plan' }))
        .rejects
        .toThrow('Failed to update subscription');
    });
  });

  describe('cancel', () => {
    it('should immediately cancel subscription with Stripe', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      await subscription.cancel(true);

      const updated = await SubscriptionModel.findById(subscription.id);
      expect(updated?.status).toBe(UserSubscriptionStatus.CANCELED);
      expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith(
        subscription.stripeSubscriptionId
      );
    });

    it('should schedule end-of-period cancellation', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      await subscription.cancel(false);

      const updated = await SubscriptionModel.findById(subscription.id);
      expect(updated?.status).toBe(UserSubscriptionStatus.ACTIVE);
      expect(updated?.cancelAtPeriodEnd).toBe(true);
      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        subscription.stripeSubscriptionId,
        expect.objectContaining({ cancel_at_period_end: true })
      );
    });
  });

  // Requirement: Rate Limiting - Different API rate limits based on subscription tier
  describe('checkUsage', () => {
    it('should verify usage within plan limits', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      
      // Seed usage data
      await executeQuery(
        'INSERT INTO usage_logs (subscription_id, feature_type, created_at) VALUES ($1, $2, NOW())',
        [subscription.id, 'api_calls']
      );

      // Seed plan limits
      await executeQuery(
        'INSERT INTO subscription_plans (id, feature_type, limit) VALUES ($1, $2, $3)',
        [subscription.planId, 'api_calls', 100]
      );

      const withinLimits = await subscription.checkUsage('api_calls');
      expect(withinLimits).toBe(true);
    });

    it('should detect when usage exceeds plan limits', async () => {
      const subscription = await SubscriptionModel.create(testSubscription);
      
      // Seed excessive usage
      for (let i = 0; i < 101; i++) {
        await executeQuery(
          'INSERT INTO usage_logs (subscription_id, feature_type, created_at) VALUES ($1, $2, NOW())',
          [subscription.id, 'api_calls']
        );
      }

      // Seed plan limits
      await executeQuery(
        'INSERT INTO subscription_plans (id, feature_type, limit) VALUES ($1, $2, $3)',
        [subscription.planId, 'api_calls', 100]
      );

      const withinLimits = await subscription.checkUsage('api_calls');
      expect(withinLimits).toBe(false);
    });
  });
});