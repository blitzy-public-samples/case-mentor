-- Migration: Create subscriptions table
-- Requirements addressed:
-- 1. Subscription System (3. SCOPE/Core Features/Subscription System)
--    - Tiered access control and payment processing for platform features
-- 2. Data Storage Schema (7. SYSTEM DESIGN/7.2 Database Design/7.2.1 Schema Design)
--    - Subscription table schema with relationships to users and payment data

-- Create subscriptions table to manage user subscription data and payment status
CREATE TABLE subscriptions (
    -- Unique identifier for each subscription record
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key reference to the user who owns this subscription
    -- Cascading delete ensures subscription is removed if user is deleted
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe subscription identifier for payment tracking
    -- Unique constraint ensures no duplicate Stripe subscriptions
    stripe_subscription_id TEXT UNIQUE,
    
    -- Current subscription status (active, inactive, cancelled, etc.)
    -- Defaults to 'inactive' for new subscriptions until payment is confirmed
    status TEXT NOT NULL DEFAULT 'inactive',
    
    -- Subscription tier level based on platform pricing tiers
    -- Defaults to 'free' tier for new users
    tier TEXT NOT NULL DEFAULT 'free',
    
    -- Start timestamp of current billing period for subscription tracking
    current_period_start TIMESTAMP WITH TIME ZONE,
    
    -- End timestamp of current billing period for subscription tracking
    current_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Scheduled cancellation timestamp if subscription is set to cancel
    cancel_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamp when subscription record was created for audit purposes
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Timestamp when subscription record was last updated for audit purposes
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on user_id for optimizing lookups of subscriptions by user
CREATE INDEX subscriptions_user_id_idx ON subscriptions USING btree (user_id);

-- Create index on stripe_subscription_id for webhook processing and payment sync
CREATE INDEX subscriptions_stripe_id_idx ON subscriptions USING btree (stripe_subscription_id);

-- Create trigger to automatically update the updated_at timestamp when record is modified
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comments for documentation
COMMENT ON TABLE subscriptions IS 'Core subscriptions table for the Case Interview Practice Platform';
COMMENT ON COLUMN subscriptions.id IS 'Unique identifier for each subscription record';
COMMENT ON COLUMN subscriptions.user_id IS 'Foreign key reference to the user who owns this subscription';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription identifier for payment tracking';
COMMENT ON COLUMN subscriptions.status IS 'Current subscription status (active, inactive, cancelled, etc.)';
COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier level (free, basic, premium) based on platform pricing tiers';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start timestamp of current billing period for subscription tracking';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End timestamp of current billing period for subscription tracking';
COMMENT ON COLUMN subscriptions.cancel_at IS 'Scheduled cancellation timestamp if subscription is set to cancel';
COMMENT ON COLUMN subscriptions.created_at IS 'Timestamp when subscription record was created for audit purposes';
COMMENT ON COLUMN subscriptions.updated_at IS 'Timestamp when subscription record was last updated for audit purposes';