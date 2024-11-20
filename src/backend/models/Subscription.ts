// @package stripe ^12.0.0

/**
 * Human Tasks:
 * 1. Set up Stripe webhook handlers for subscription lifecycle events
 * 2. Configure subscription plan tiers in Stripe dashboard
 * 3. Set up monitoring for subscription payment failures
 * 4. Configure usage tracking metrics collection
 * 5. Set up alerts for subscription cancellations and failed payments
 */

import { Stripe } from 'stripe';
import { Subscription, isSubscription } from '../types/subscription';
import { executeQuery, withTransaction } from '../utils/database';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Subscription model class for managing subscription data and operations
 * Requirement: Subscription System - Tiered access control, payment processing, account management
 */
export class SubscriptionModel implements Subscription {
  public id: string;
  public userId: string;
  public planId: string;
  public status: UserSubscriptionStatus;
  public currentPeriodStart: Date;
  public currentPeriodEnd: Date;
  public cancelAtPeriodEnd: boolean;
  public stripeSubscriptionId: string;
  public stripeCustomerId: string;

  constructor(data: Subscription) {
    if (!isSubscription(data)) {
      throw new Error('Invalid subscription data');
    }

    this.id = data.id;
    this.userId = data.userId;
    this.planId = data.planId;
    this.status = data.status;
    this.currentPeriodStart = new Date(data.currentPeriodStart);
    this.currentPeriodEnd = new Date(data.currentPeriodEnd);
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    this.stripeSubscriptionId = data.stripeSubscriptionId;
    this.stripeCustomerId = data.stripeCustomerId;
  }

  /**
   * Creates a new subscription with Stripe integration
   * Requirement: Subscription System - Payment processing integration
   */
  public static async create(data: Subscription): Promise<SubscriptionModel> {
    try {
      const subscription = await withTransaction(async () => {
        // Create Stripe subscription
        const stripeSubscription = await stripe.subscriptions.create({
          customer: data.stripeCustomerId,
          items: [{ price: data.planId }],
          expand: ['latest_invoice.payment_intent'],
        });

        // Prepare subscription data
        const subscriptionData: Subscription = {
          ...data,
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
        };

        // Store in database
        const result = await executeQuery<Subscription>(
          'INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [
            subscriptionData.id,
            subscriptionData.userId,
            subscriptionData.planId,
            subscriptionData.status,
            subscriptionData.currentPeriodStart,
            subscriptionData.currentPeriodEnd,
            subscriptionData.cancelAtPeriodEnd,
            subscriptionData.stripeSubscriptionId,
            subscriptionData.stripeCustomerId,
          ]
        );

        return result;
      });

      return new SubscriptionModel(subscription);
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Retrieves a subscription by ID
   */
  public static async findById(id: string): Promise<SubscriptionModel | null> {
    try {
      const subscription = await executeQuery<Subscription | null>(
        'SELECT * FROM subscriptions WHERE id = $1',
        [id]
      );

      return subscription ? new SubscriptionModel(subscription) : null;
    } catch (error) {
      throw new Error(`Failed to find subscription: ${error.message}`);
    }
  }

  /**
   * Retrieves a user's active subscription
   */
  public static async findByUserId(userId: string): Promise<SubscriptionModel | null> {
    try {
      const subscription = await executeQuery<Subscription | null>(
        'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
        [userId, 'ACTIVE']
      );

      return subscription ? new SubscriptionModel(subscription) : null;
    } catch (error) {
      throw new Error(`Failed to find user subscription: ${error.message}`);
    }
  }

  /**
   * Updates subscription details with Stripe synchronization
   */
  public async update(data: Partial<Subscription>): Promise<SubscriptionModel> {
    try {
      const updatedSubscription = await withTransaction(async () => {
        // Update Stripe subscription if necessary
        if (data.planId) {
          await stripe.subscriptions.update(this.stripeSubscriptionId, {
            items: [{ price: data.planId }],
          });
        }

        // Update database record
        const result = await executeQuery<Subscription>(
          'UPDATE subscriptions SET plan_id = COALESCE($1, plan_id), status = COALESCE($2, status), current_period_start = COALESCE($3, current_period_start), current_period_end = COALESCE($4, current_period_end), cancel_at_period_end = COALESCE($5, cancel_at_period_end) WHERE id = $6 RETURNING *',
          [
            data.planId || this.planId,
            data.status || this.status,
            data.currentPeriodStart || this.currentPeriodStart,
            data.currentPeriodEnd || this.currentPeriodEnd,
            data.cancelAtPeriodEnd ?? this.cancelAtPeriodEnd,
            this.id,
          ]
        );

        return result;
      });

      return new SubscriptionModel(updatedSubscription);
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancels the subscription
   * Requirement: Subscription System - Account management
   */
  public async cancel(immediately: boolean = false): Promise<void> {
    try {
      await withTransaction(async () => {
        // Cancel Stripe subscription
        if (immediately) {
          await stripe.subscriptions.cancel(this.stripeSubscriptionId);
        } else {
          await stripe.subscriptions.update(this.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        }

        // Update database record
        await executeQuery(
          'UPDATE subscriptions SET status = $1, cancel_at_period_end = $2 WHERE id = $3',
          [immediately ? 'CANCELED' : 'ACTIVE', !immediately, this.id]
        );
      });
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Checks current usage against subscription tier limits
   * Requirement: Rate Limiting - Different API rate limits based on subscription tier
   */
  public async checkUsage(featureType: string): Promise<boolean> {
    try {
      const usage = await executeQuery<{ current_usage: number }>(
        'SELECT COUNT(*) as current_usage FROM usage_logs WHERE subscription_id = $1 AND feature_type = $2 AND created_at > NOW() - INTERVAL \'1 day\'',
        [this.id, featureType]
      );

      const limits = await executeQuery<{ limit: number }>(
        'SELECT limit FROM subscription_plans WHERE id = $1 AND feature_type = $2',
        [this.planId, featureType]
      );

      return usage.current_usage < limits.limit;
    } catch (error) {
      throw new Error(`Failed to check usage: ${error.message}`);
    }
  }
}