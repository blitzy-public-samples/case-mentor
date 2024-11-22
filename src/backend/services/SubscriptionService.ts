// @package stripe ^12.0.0

/**
 * Human Tasks:
 * 1. Configure Stripe webhook endpoint URL in dashboard
 * 2. Set up monitoring for failed payments and subscription events
 * 3. Configure proper error alerting for payment processing failures
 * 4. Set up automated subscription usage tracking
 * 5. Implement proper logging for subscription lifecycle events
 */

import { Stripe } from 'stripe';
import { 
    SubscriptionModel, 
    create as createSubscription,
    findById,
    findByUserId,
    update as updateSubscriptionModel,
    cancel as cancelSubscriptionModel,
    checkUsage
} from '../models/Subscription';
import { stripeClient } from '../config/stripe';
import { SUBSCRIPTION_PRODUCTS } from '../config/stripe';
import { 
    SubscriptionPlan,
    Subscription,
    SubscriptionUsage
} from '../types/subscription';
import { UserSubscriptionStatus } from '../types/user';

/**
 * Service class for managing subscription operations and Stripe integration
 * Requirement: Subscription System - Tiered access control, payment processing, account management
 */
export class SubscriptionService {
    private readonly stripe: Stripe;
    private readonly subscriptionProducts: Record<string, SubscriptionPlan>;

    constructor() {
        this.stripe = stripeClient;
        this.subscriptionProducts = SUBSCRIPTION_PRODUCTS;
    }

    /**
     * Creates a new subscription for a user
     * Requirement: Subscription System - Payment processing integration
     */
    public async createSubscription(
        userId: string,
        planId: string,
        paymentMethodId: string
    ): Promise<Subscription> {
        try {
            // Validate plan existence
            const plan = this.subscriptionProducts[planId];
            if (!plan) {
                throw new Error('Invalid subscription plan');
            }

            // Create or retrieve Stripe customer
            const existingSubscription = await findByUserId(userId);
            let stripeCustomerId: string;

            if (existingSubscription) {
                stripeCustomerId = existingSubscription.stripeCustomerId;
            } else {
                const customer = await this.stripe.customers.create({
                    metadata: { userId }
                });
                stripeCustomerId = customer.id;
            }

            // Attach payment method to customer
            await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: stripeCustomerId
            });

            // Set as default payment method
            await this.stripe.customers.update(stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });

            // Create Stripe subscription
            const stripeSubscription = await this.stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [{ price: plan.stripeProductId }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    payment_method_types: ['card'],
                    save_default_payment_method: 'on_subscription'
                },
                expand: ['latest_invoice.payment_intent']
            });

            // Create local subscription record
            const subscription = await createSubscription({
                id: crypto.randomUUID(), // Add unique ID for the subscription
                userId,
                planId,
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId,
                status: UserSubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: false
            });

            return subscription;
        } catch (err: unknown) {
            const error = err as Error;
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }

    /**
     * Updates an existing subscription
     * Requirement: Subscription System - Account management
     */
    public async updateSubscription(
        subscriptionId: string,
        updateData: Partial<Subscription>
    ): Promise<Subscription> {
        try {
            const subscription = await findById(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            // Update Stripe subscription if plan changed
            if (updateData.planId && updateData.planId !== subscription.planId) {
                const plan = this.subscriptionProducts[updateData.planId];
                if (!plan) {
                    throw new Error('Invalid subscription plan');
                }

                await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    items: [{
                        id: subscription.stripeSubscriptionId,
                        price: plan.stripeProductId
                    }],
                    proration_behavior: 'create_prorations'
                });
            }

            // Update local subscription record
            const updatedSubscription = await updateSubscriptionModel(subscription, updateData);
            return updatedSubscription;
        } catch (err: unknown) {
            const error = err as Error;
            throw new Error(`Failed to update subscription: ${error.message}`);
        }
    }

    /**
     * Cancels a subscription
     * Requirement: Subscription System - Account management
     */
    public async cancelSubscription(
        subscriptionId: string,
        immediately: boolean = false
    ): Promise<void> {
        try {
            const subscription = await findById(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            // Cancel Stripe subscription
            if (immediately) {
                await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
            } else {
                await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: true
                });
            }

            // Update local subscription record
            await cancelSubscriptionModel(subscription, immediately);
        } catch (err: unknown) {
            const error = err as Error;
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    /**
     * Retrieves current usage metrics for a subscription
     * Requirement: Rate Limiting - Different API rate limits based on subscription tier
     */
    public async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage> {
        try {
            const subscription = await findById(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const plan = this.subscriptionProducts[subscription.planId];
            if (!plan) {
                throw new Error('Invalid subscription plan');
            }

            // Get current usage metrics for each feature type
            const drillUsage = await checkUsage(subscription, 'drills');
            const simulationUsage = await checkUsage(subscription, 'simulations');
            const apiUsage = await checkUsage(subscription, 'evaluations');

            return {
                subscriptionId,
                drillAttempts: plan.limits.drillAttemptsPerDay,
                simulationAttempts: plan.limits.simulationAttemptsPerDay,
                apiRequests: plan.limits.apiRequestsPerHour,
                period: new Date()
            };
        } catch (err: unknown) {
            const error = err as Error;
            throw new Error(`Failed to get subscription usage: ${error.message}`);
        }
    }

    /**
     * Handles Stripe webhook events for subscription updates
     * Requirement: Subscription System - Payment processing
     */
    public async handleWebhook(event: Stripe.Event): Promise<void> {
        try {
            switch (event.type) {
                case 'customer.subscription.created':
                case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;
                    const existingSubscription = await findById(subscription.id);
                    if (existingSubscription) {
                        await updateSubscriptionModel(existingSubscription, {
                            status: subscription.status === 'active' ? UserSubscriptionStatus.ACTIVE : UserSubscriptionStatus.PAST_DUE,
                            currentPeriodStart: new Date(subscription.current_period_start * 1000),
                            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                            cancelAtPeriodEnd: subscription.cancel_at_period_end
                        });
                    }
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const existingSubscription = await findById(subscription.id);
                    if (existingSubscription) {
                        await cancelSubscriptionModel(existingSubscription, true);
                    }
                    break;
                }
                case 'invoice.payment_failed': {
                    const invoice = event.data.object as Stripe.Invoice;
                    const subscription = invoice.subscription as string;
                    const existingSubscription = await findById(subscription);
                    if (existingSubscription) {
                        await updateSubscriptionModel(existingSubscription, {
                            status: UserSubscriptionStatus.PAST_DUE
                        });
                    }
                    break;
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            throw new Error(`Failed to handle webhook event: ${error.message}`);
        }
    }
}