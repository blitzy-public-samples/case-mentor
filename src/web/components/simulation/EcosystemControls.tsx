/**
 * Human Tasks:
 * 1. Verify ARIA labels and descriptions with screen reader testing
 * 2. Test keyboard navigation flow across all controls
 * 3. Validate color contrast ratios for all control states
 * 4. Ensure touch targets meet minimum size requirements on mobile devices
 */

// React v18.0.0
import React, { useState, useCallback } from 'react';

// Internal imports
import { EnvironmentParameters, SimulationStatus } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import Select from '../shared/Select';
import Button from '../shared/Button';

// Environment parameter options with ARIA-compliant labels
const TEMPERATURE_OPTIONS = [
  { value: '15', label: '15°C' },
  { value: '20', label: '20°C' },
  { value: '25', label: '25°C' }
];

const DEPTH_OPTIONS = [
  { value: '30', label: '30m' },
  { value: '50', label: '50m' },
  { value: '70', label: '70m' }
];

const SALINITY_OPTIONS = [
  { value: '30', label: '30cm/s' },
  { value: '35', label: '35cm/s' },
  { value: '40', label: '40cm/s' }
];

const LIGHT_LEVEL_OPTIONS = [
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100%' }
];

interface EcosystemControlsProps {
  className?: string;
}

// Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
export default function EcosystemControls({ className }: EcosystemControlsProps): JSX.Element {
  // Initialize simulation state and controls
  const {
    simulationState,
    loading,
    updateEnvironment,
    startSimulation,
    stopSimulation,
    resetSimulation
  } = useSimulation();

  // Track local environment parameter state
  const [environment, setEnvironment] = useState<EnvironmentParameters>({
    temperature: 20,
    depth: 50,
    salinity: 35,
    lightLevel: 75
  });

  // Requirement: Simulation Engine - Handles ecosystem game logic
  const handleEnvironmentChange = useCallback(async (
    parameter: keyof EnvironmentParameters,
    value: string
  ) => {
    const numericValue = parseFloat(value);
    const updatedEnvironment = {
      ...environment,
      [parameter]: numericValue
    };
    setEnvironment(updatedEnvironment);
    await updateEnvironment(updatedEnvironment);
  }, [environment, updateEnvironment]);

  // Requirement: Accessibility Requirements - WCAG 2.1 AA compliant controls
  return (
    <div 
      className={`space-y-6 p-4 rounded-lg border border-gray-200 ${className}`}
      role="region"
      aria-label="Ecosystem Simulation Controls"
    >
      {/* Environment Parameters Section */}
      <div 
        className="space-y-4"
        role="group"
        aria-label="Environment Parameters"
      >
        <Select
          value={environment.temperature.toString()}
          options={TEMPERATURE_OPTIONS}
          onChange={(value) => handleEnvironmentChange('temperature', value)}
          placeholder="Select Temperature"
          disabled={loading || simulationState?.status === SimulationStatus.RUNNING}
          aria-label="Water Temperature"
        />

        <Select
          value={environment.depth.toString()}
          options={DEPTH_OPTIONS}
          onChange={(value) => handleEnvironmentChange('depth', value)}
          placeholder="Select Depth"
          disabled={loading || simulationState?.status === SimulationStatus.RUNNING}
          aria-label="Water Depth"
        />

        <Select
          value={environment.salinity.toString()}
          options={SALINITY_OPTIONS}
          onChange={(value) => handleEnvironmentChange('salinity', value)}
          placeholder="Select Salinity"
          disabled={loading || simulationState?.status === SimulationStatus.RUNNING}
          aria-label="Water Salinity"
        />

        <Select
          value={environment.lightLevel.toString()}
          options={LIGHT_LEVEL_OPTIONS}
          onChange={(value) => handleEnvironmentChange('lightLevel', value)}
          placeholder="Select Light Level"
          disabled={loading || simulationState?.status === SimulationStatus.RUNNING}
          aria-label="Light Level"
        />
      </div>

      {/* Simulation Controls Section */}
      <div 
        className="flex flex-wrap gap-4"
        role="group"
        aria-label="Simulation Controls"
      >
        {simulationState?.status !== SimulationStatus.RUNNING ? (
          <Button
            variant="primary"
            onClick={startSimulation}
            disabled={loading}
            isLoading={loading}
            aria-label="Start Simulation"
          >
            Start
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={stopSimulation}
            disabled={loading}
            isLoading={loading}
            aria-label="Stop Simulation"
          >
            Stop
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={resetSimulation}
          disabled={loading || simulationState?.status === SimulationStatus.RUNNING}
          aria-label="Reset Simulation"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}