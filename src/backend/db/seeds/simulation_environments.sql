-- Addresses requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
-- Addresses requirement: Simulation Engine - Handles ecosystem game logic and simulation state

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data to ensure clean seed
TRUNCATE TABLE simulation_environments CASCADE;

-- Insert predefined simulation environments with varying difficulty levels
INSERT INTO simulation_environments (
    id,
    name,
    description,
    temperature,
    depth,
    salinity,
    light_level,
    difficulty,
    created_at
) VALUES 
-- Beginner level environment: Shallow Reef
-- Optimal conditions for beginners to learn basic ecosystem management
(
    uuid_generate_v4(),
    'Shallow Reef',
    'A vibrant coral reef ecosystem in warm, shallow waters with abundant sunlight. Perfect for beginners to learn basic ecosystem management principles. Features stable conditions and predictable species interactions.',
    28.5,  -- Warm temperature optimal for coral growth (°C)
    15.0,  -- Shallow depth (meters)
    35.0,  -- Standard ocean salinity (ppt)
    90.0,  -- High light levels for photosynthesis (%)
    'beginner',
    CURRENT_TIMESTAMP
),

-- Intermediate level environment: Deep Ocean
-- Challenges players with limited light and colder temperatures
(
    uuid_generate_v4(),
    'Deep Ocean',
    'A mysterious deep ocean environment where light is scarce and temperatures are cold. Players must manage species adapted to high pressure and low light conditions. Requires understanding of deep-sea ecosystem dynamics.',
    4.0,   -- Cold deep ocean temperature (°C)
    800.0, -- Deep ocean depth (meters)
    34.5,  -- Typical deep ocean salinity (ppt)
    10.0,  -- Very low light levels (%)
    'intermediate',
    CURRENT_TIMESTAMP
),

-- Advanced level environment: Coastal Waters
-- Tests adaptation to fluctuating conditions
(
    uuid_generate_v4(),
    'Coastal Waters',
    'Dynamic coastal environment with varying conditions influenced by tides, river inputs, and seasonal changes. Players must adapt their strategy to handle fluctuating parameters and maintain ecosystem stability.',
    22.0,  -- Moderate temperature with seasonal variation (°C)
    45.0,  -- Moderate depth (meters)
    30.0,  -- Variable salinity due to freshwater input (ppt)
    60.0,  -- Moderate light levels with daily variation (%)
    'advanced',
    CURRENT_TIMESTAMP
),

-- Expert level environment: Hydrothermal Vent
-- Extreme conditions requiring sophisticated management
(
    uuid_generate_v4(),
    'Hydrothermal Vent',
    'Extreme deep-sea environment near hydrothermal vents with challenging conditions. Players must manage unique chemosynthetic ecosystems and handle extreme temperature gradients. Requires expert knowledge of specialized adaptations.',
    85.0,  -- Extreme temperature near vents (°C)
    2500.0, -- Abyssal depth (meters)
    38.0,   -- High salinity due to mineral-rich waters (ppt)
    0.0,    -- No natural light (%)
    'expert',
    CURRENT_TIMESTAMP
),

-- Expert level environment: Polar Waters
-- Challenges players with extreme cold and seasonal light variations
(
    uuid_generate_v4(),
    'Polar Waters',
    'Arctic marine environment with extreme cold and seasonal variations in light availability. Players must manage species adapted to subzero temperatures and handle months-long periods of darkness.',
    -1.8,  -- Subzero temperatures typical of polar waters (°C)
    200.0, -- Continental shelf depth (meters)
    34.5,  -- Polar water salinity (ppt)
    30.0,  -- Variable light levels with seasonal extremes (%)
    'expert',
    CURRENT_TIMESTAMP
);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_simulation_environments_difficulty 
ON simulation_environments(difficulty);

CREATE INDEX IF NOT EXISTS idx_simulation_environments_created_at 
ON simulation_environments(created_at);