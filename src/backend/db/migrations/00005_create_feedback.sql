-- Migration: Create feedback table
-- Requirements addressed:
-- 1. AI Evaluation (2. SYSTEM OVERVIEW/Core Services)
--    - AI evaluation and feedback generation for user practice attempts
-- 2. Progress Tracking (3. SCOPE/Core Features/User Management)
--    - Track user progress and performance analytics through detailed feedback
-- 3. User Satisfaction (2. SYSTEM OVERVIEW/Success Criteria)
--    - >4.5/5 average feedback score through quality feedback and evaluations

-- Create feedback table with polymorphic association pattern for drill and simulation attempts
CREATE TABLE feedback (
    -- Unique identifier for each feedback entry
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Type of attempt this feedback is for (polymorphic discriminator)
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('DRILL', 'SIMULATION')),
    
    -- References to attempt tables with cascade delete
    drill_attempt_id UUID REFERENCES drill_attempts(id) ON DELETE CASCADE,
    simulation_attempt_id UUID REFERENCES simulation_attempts(id) ON DELETE CASCADE,
    
    -- Structured feedback content in JSON format
    feedback_content JSONB NOT NULL,
    
    -- Numerical evaluation score
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    
    -- Detailed evaluation metrics and rubric scores
    evaluation_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Array of improvement areas with actionable suggestions
    improvement_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- AI model version for feedback quality tracking
    model_version TEXT NOT NULL,
    
    -- UTC timestamp of feedback generation
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
) PARTITION BY RANGE (created_at);

-- Create indexes for optimizing queries
CREATE INDEX feedback_drill_attempt_idx 
ON feedback USING btree (drill_attempt_id);

CREATE INDEX feedback_simulation_attempt_idx 
ON feedback USING btree (simulation_attempt_id);

CREATE INDEX feedback_created_at_idx 
ON feedback USING btree (created_at);

-- Add polymorphic association constraint
ALTER TABLE feedback ADD CONSTRAINT feedback_attempt_type_check
    CHECK ((attempt_type = 'DRILL' AND drill_attempt_id IS NOT NULL AND simulation_attempt_id IS NULL) 
        OR (attempt_type = 'SIMULATION' AND simulation_attempt_id IS NOT NULL AND drill_attempt_id IS NULL));

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
        partition_name := 'feedback_' || TO_CHAR(partition_date, 'YYYY_MM');
        sql := FORMAT(
            'CREATE TABLE %I PARTITION OF feedback 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            partition_date,
            partition_date + '1 month'::INTERVAL
        );
        EXECUTE sql;
    END LOOP;
END $$;

-- Add table and column comments
COMMENT ON TABLE feedback IS 'Stores AI-generated feedback for drill and simulation attempts with polymorphic association';
COMMENT ON COLUMN feedback.id IS 'Unique identifier for each feedback entry';
COMMENT ON COLUMN feedback.attempt_type IS 'Type of attempt this feedback is for - either DRILL or SIMULATION';
COMMENT ON COLUMN feedback.drill_attempt_id IS 'Reference to drill attempt if feedback is for a drill, cascades deletion';
COMMENT ON COLUMN feedback.simulation_attempt_id IS 'Reference to simulation attempt if feedback is for a simulation, cascades deletion';
COMMENT ON COLUMN feedback.feedback_content IS 'Structured feedback content including strengths, weaknesses, and improvement suggestions in JSON format';
COMMENT ON COLUMN feedback.score IS 'Numerical score assigned by AI evaluation (0-100) for performance tracking';
COMMENT ON COLUMN feedback.evaluation_metrics IS 'Detailed evaluation metrics and rubric scores in JSON format for analytics';
COMMENT ON COLUMN feedback.improvement_areas IS 'Array of specific areas identified for improvement with actionable suggestions';
COMMENT ON COLUMN feedback.model_version IS 'Version of the AI model used for evaluation, for tracking feedback quality over model updates';
COMMENT ON COLUMN feedback.created_at IS 'UTC timestamp when the feedback was generated';