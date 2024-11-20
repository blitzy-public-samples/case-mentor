-- Migration: Create drill_attempts table
-- Requirements addressed:
-- 1. Practice Drills (3. SCOPE/Core Features/Practice Drills)
--    - Track and store user attempts for various drill types
-- 2. User Engagement (2. SYSTEM OVERVIEW/Success Criteria)
--    - Track >80% completion rate for started drills
-- 3. Progress Tracking (3. SCOPE/Core Features/User Management)
--    - Track user progress and performance analytics

-- Create drill_attempts table with comprehensive attempt tracking capabilities
CREATE TABLE drill_attempts (
    -- Unique identifier for each drill attempt
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to the user making the attempt
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type of drill being attempted
    drill_type TEXT NOT NULL CHECK (
        drill_type IN (
            'CASE_PROMPT',
            'CALCULATION',
            'CASE_MATH',
            'BRAINSTORMING',
            'MARKET_SIZING',
            'SYNTHESIZING'
        )
    ),
    
    -- Difficulty level of the drill
    difficulty TEXT NOT NULL CHECK (
        difficulty IN (
            'BEGINNER',
            'INTERMEDIATE',
            'ADVANCED'
        )
    ),
    
    -- Current status of the attempt
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (
        status IN (
            'NOT_STARTED',
            'IN_PROGRESS',
            'COMPLETED',
            'EVALUATED'
        )
    ),
    
    -- User's response data in flexible JSON format
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Evaluation score (0-100)
    score INTEGER CHECK (score >= 0 AND score <= 100),
    
    -- Structured feedback from AI evaluation
    feedback JSONB DEFAULT '{}'::jsonb,
    
    -- Time spent in seconds
    time_spent INTEGER DEFAULT 0,
    
    -- Timestamps for tracking attempt lifecycle
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    completed_at TIMESTAMP WITH TIME ZONE,
    evaluated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for optimizing common queries
CREATE INDEX drill_attempts_user_id_idx 
ON drill_attempts USING btree (user_id);

CREATE INDEX drill_attempts_type_status_idx 
ON drill_attempts USING btree (drill_type, status);

CREATE INDEX drill_attempts_completed_at_idx 
ON drill_attempts USING btree (completed_at);

-- Implement table partitioning by month based on started_at
CREATE TABLE drill_attempts_partitioned (
    LIKE drill_attempts INCLUDING ALL
) PARTITION BY RANGE (started_at);

-- Create initial partitions for the current month and next month
CREATE TABLE drill_attempts_y2024m01 PARTITION OF drill_attempts_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE drill_attempts_y2024m02 PARTITION OF drill_attempts_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add table and column comments for documentation
COMMENT ON TABLE drill_attempts IS 'Tracks user practice attempts and performance across different drill types';
COMMENT ON COLUMN drill_attempts.id IS 'Unique identifier for each drill attempt';
COMMENT ON COLUMN drill_attempts.user_id IS 'Foreign key reference to the user making the attempt';
COMMENT ON COLUMN drill_attempts.drill_type IS 'Type of drill being attempted';
COMMENT ON COLUMN drill_attempts.difficulty IS 'Difficulty level of the drill for progression tracking';
COMMENT ON COLUMN drill_attempts.status IS 'Current status of the drill attempt for completion analytics';
COMMENT ON COLUMN drill_attempts.response_data IS 'User''s response data in JSON format';
COMMENT ON COLUMN drill_attempts.score IS 'Evaluation score (0-100) for performance tracking';
COMMENT ON COLUMN drill_attempts.feedback IS 'Structured feedback from AI evaluation';
COMMENT ON COLUMN drill_attempts.time_spent IS 'Time spent in seconds on the drill';
COMMENT ON COLUMN drill_attempts.started_at IS 'UTC timestamp when the drill attempt was started';
COMMENT ON COLUMN drill_attempts.completed_at IS 'UTC timestamp when the drill attempt was completed';
COMMENT ON COLUMN drill_attempts.evaluated_at IS 'UTC timestamp when the drill attempt was evaluated';

-- Create function to manage monthly partitions automatically
CREATE OR REPLACE FUNCTION create_drill_attempts_partition()
RETURNS void AS $$
DECLARE
    next_partition_date DATE;
    partition_name TEXT;
    partition_start_date TEXT;
    partition_end_date TEXT;
BEGIN
    -- Calculate the first day of next month
    next_partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    
    -- Generate partition name in format drill_attempts_y2024m01
    partition_name := 'drill_attempts_y' || 
                     TO_CHAR(next_partition_date, 'YYYY') ||
                     'm' || 
                     TO_CHAR(next_partition_date, 'MM');
    
    -- Generate partition range dates
    partition_start_date := TO_CHAR(next_partition_date, 'YYYY-MM-DD');
    partition_end_date := TO_CHAR(next_partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
    
    -- Create new partition if it doesn't exist
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF drill_attempts_partitioned
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        partition_start_date,
        partition_end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to create partitions monthly (requires pg_cron extension)
-- Note: This needs to be run by a superuser or user with appropriate permissions
-- COMMENT OUT if pg_cron is not available
-- SELECT cron.schedule('0 0 1 * *', $$SELECT create_drill_attempts_partition()$$);