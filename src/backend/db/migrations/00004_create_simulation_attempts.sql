-- Migration: Create simulation_attempts table
-- Requirements addressed:
-- 1. McKinsey Simulation (3. SCOPE/Core Features/McKinsey Simulation)
--    - Ecosystem game replication with time-pressured scenarios and complex data analysis
-- 2. Progress Tracking (3. SCOPE/Core Features/User Management)
--    - Track user progress and performance analytics

-- Create simulation_attempts table for tracking McKinsey ecosystem simulation game attempts
CREATE TABLE simulation_attempts (
    -- Unique identifier for each simulation attempt
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key reference to the user making the attempt
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current status of the simulation attempt
    status TEXT NOT NULL DEFAULT 'SETUP'
        CHECK (status IN ('SETUP', 'RUNNING', 'COMPLETED', 'FAILED')),
    
    -- Selected species and their configurations in JSON format
    species_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Environment configuration parameters
    environment_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Current state of the ecosystem
    ecosystem_state JSONB DEFAULT '{}'::jsonb,
    
    -- Performance metrics
    metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Overall simulation performance score
    score INTEGER CHECK (score >= 0 AND score <= 100),
    
    -- Structured feedback messages
    feedback JSONB DEFAULT '[]'::jsonb,
    
    -- Time spent in seconds
    time_spent INTEGER DEFAULT 0,
    
    -- Timestamps for attempt tracking
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (started_at);

-- Create indexes for optimizing queries
CREATE INDEX simulation_attempts_user_id_idx 
    ON simulation_attempts USING btree (user_id);

CREATE INDEX simulation_attempts_status_idx 
    ON simulation_attempts USING btree (status);

CREATE INDEX simulation_attempts_completed_at_idx 
    ON simulation_attempts USING btree (completed_at);

-- Create monthly partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    partition_date DATE;
    partition_name TEXT;
    sql TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        partition_date := start_date + (i || ' months')::INTERVAL;
        partition_name := 'simulation_attempts_' || TO_CHAR(partition_date, 'YYYY_MM');
        sql := FORMAT(
            'CREATE TABLE %I PARTITION OF simulation_attempts 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            partition_date,
            partition_date + '1 month'::INTERVAL
        );
        EXECUTE sql;
    END LOOP;
END $$;

-- Add table and column comments
COMMENT ON TABLE simulation_attempts IS 'Core simulation_attempts table for tracking McKinsey ecosystem simulation game attempts';
COMMENT ON COLUMN simulation_attempts.id IS 'Unique identifier for each simulation attempt';
COMMENT ON COLUMN simulation_attempts.user_id IS 'Foreign key reference to the user making the attempt, cascades deletion';
COMMENT ON COLUMN simulation_attempts.status IS 'Current status of the simulation attempt with strict state validation';
COMMENT ON COLUMN simulation_attempts.species_data IS 'Selected species and their configurations in JSON format including population sizes, traits, and interactions';
COMMENT ON COLUMN simulation_attempts.environment_parameters IS 'Environment configuration parameters (temperature, depth, salinity, light level) affecting species interactions';
COMMENT ON COLUMN simulation_attempts.ecosystem_state IS 'Current state of the ecosystem including species interactions, population dynamics, and stability metrics';
COMMENT ON COLUMN simulation_attempts.metrics IS 'Performance metrics including species diversity index, trophic efficiency, stability score, and ecosystem resilience';
COMMENT ON COLUMN simulation_attempts.score IS 'Overall simulation performance score (0-100) based on ecosystem stability and diversity';
COMMENT ON COLUMN simulation_attempts.feedback IS 'Array of structured feedback messages about ecosystem design, species balance, and improvement suggestions';
COMMENT ON COLUMN simulation_attempts.time_spent IS 'Time spent in seconds on the simulation attempt for performance tracking';
COMMENT ON COLUMN simulation_attempts.started_at IS 'UTC timestamp when the simulation attempt was started';
COMMENT ON COLUMN simulation_attempts.completed_at IS 'UTC timestamp when the simulation attempt was completed or failed';