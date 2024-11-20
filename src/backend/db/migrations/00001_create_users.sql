-- Migration: Create users table
-- Requirements addressed:
-- 1. User Management (3. SCOPE/Core Features/User Management)
--    - Profile customization and user management capabilities including profile data storage and tracking
-- 2. Data Storage Schema (7. SYSTEM DESIGN/7.2 Database Design/7.2.1 Schema Design)
--    - Core users table schema with UUID primary key, email authentication, profile data, and audit timestamps

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with comprehensive user management capabilities
CREATE TABLE users (
    -- Unique identifier for each user using UUID v4 for global uniqueness and security
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Email address for authentication, communication, and account recovery
    -- Must be unique across the system
    email TEXT NOT NULL UNIQUE,
    
    -- Securely hashed user password
    -- Raw passwords are never stored in the database
    password_hash TEXT NOT NULL,
    
    -- Flexible JSON storage for user profile information
    -- Includes preferences, settings, and customization options
    -- Defaults to empty JSON object
    profile_data JSONB DEFAULT '{}'::jsonb,
    
    -- UTC timestamp of user account creation
    -- Used for audit and tracking purposes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- UTC timestamp of last user record update
    -- Used for change tracking and audit purposes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on email for optimizing login lookups and email uniqueness checks
CREATE INDEX users_email_idx ON users USING btree (email);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp when record is modified
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comments for documentation
COMMENT ON TABLE users IS 'Core users table for the Case Interview Practice Platform';
COMMENT ON COLUMN users.id IS 'Unique identifier for each user, generated using UUID v4 for global uniqueness and security';
COMMENT ON COLUMN users.email IS 'User''s email address used for authentication, communication, and account recovery. Must be unique across the system';
COMMENT ON COLUMN users.password_hash IS 'Securely hashed user password using industry-standard hashing algorithm. Raw passwords are never stored';
COMMENT ON COLUMN users.profile_data IS 'Flexible JSON storage for user profile information including preferences, settings, and customization options';
COMMENT ON COLUMN users.created_at IS 'UTC timestamp of user account creation for audit and tracking purposes';
COMMENT ON COLUMN users.updated_at IS 'UTC timestamp of last user record update for change tracking and audit purposes';