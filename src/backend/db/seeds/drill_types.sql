-- Seed: Initialize core drill types
-- Requirements addressed:
-- 1. Practice Drills (3. SCOPE/Core Features/Practice Drills)
--    - Initialize core drill types with configurations
-- 2. Drill Structure (7. SYSTEM DESIGN/User Interface Design/7.1.3 Critical User Flows)
--    - Support drill selection and execution flow

-- Insert core drill types with their configurations
INSERT INTO drill_types (
    code,
    name,
    description,
    difficulty_levels,
    time_limit,
    evaluation_criteria
) VALUES 
-- Case Prompt Drills
(
    'CASE_PROMPT',
    'Case Prompt Drills',
    'Practice analyzing and structuring responses to case interview prompts',
    '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
    900, -- 15 minutes
    '{
        "structure": true,
        "clarity": true,
        "analysis_depth": true
    }'::jsonb
),

-- Calculations Drills
(
    'CALCULATION',
    'Calculations Drills',
    'Practice quick mental math and business calculations',
    '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
    300, -- 5 minutes
    '{
        "accuracy": true,
        "speed": true,
        "method": true
    }'::jsonb
),

-- Case Math Drills
(
    'CASE_MATH',
    'Case Math Drills',
    'Practice complex mathematical analysis in business contexts',
    '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
    600, -- 10 minutes
    '{
        "accuracy": true,
        "approach": true,
        "business_context": true
    }'::jsonb
),

-- Brainstorming Drills
(
    'BRAINSTORMING',
    'Brainstorming Drills',
    'Practice generating comprehensive solution ideas',
    '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
    600, -- 10 minutes
    '{
        "quantity": true,
        "quality": true,
        "creativity": true
    }'::jsonb
),

-- Market Sizing Drills
(
    'MARKET_SIZING',
    'Market Sizing Drills',
    'Practice estimating market sizes and volumes',
    '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
    600, -- 10 minutes
    '{
        "approach": true,
        "assumptions": true,
        "calculation": true
    }'::jsonb
),

-- Synthesizing Drills
(
    'SYNTHESIZING',
    'Synthesizing Drills',
    'Practice combining information to form coherent conclusions',
    '["BEGINNER", "INTERMEDIATE", "ADVANCED"]'::jsonb,
    600, -- 10 minutes
    '{
        "completeness": true,
        "coherence": true,
        "insight": true
    }'::jsonb
);

-- Add indexes to optimize drill type lookups
CREATE INDEX IF NOT EXISTS drill_types_code_idx ON drill_types (code);
CREATE INDEX IF NOT EXISTS drill_types_difficulty_gin_idx ON drill_types USING gin (difficulty_levels);

-- Add table comments for documentation
COMMENT ON TABLE drill_types IS 'Core drill types and their configurations for the practice drill system';
COMMENT ON COLUMN drill_types.code IS 'Unique code identifier matching drill_attempts table constraint';
COMMENT ON COLUMN drill_types.name IS 'Display name of the drill type';
COMMENT ON COLUMN drill_types.description IS 'Detailed description of the drill type and its purpose';
COMMENT ON COLUMN drill_types.difficulty_levels IS 'Available difficulty levels for this drill type';
COMMENT ON COLUMN drill_types.time_limit IS 'Default time limit in seconds for completing this drill type';
COMMENT ON COLUMN drill_types.evaluation_criteria IS 'Criteria used for AI evaluation of drill attempts';