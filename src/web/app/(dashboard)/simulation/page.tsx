// Third-party imports
import React from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0

// Internal imports
import SimulationCard from '../../../components/simulation/SimulationCard';
import EcosystemCanvas from '../../../components/simulation/EcosystemCanvas';
import SpeciesSelector from '../../../components/simulation/SpeciesSelector';
import { useSimulation } from '../../../hooks/useSimulation';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated testing tools
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate color contrast ratios for all UI elements
 * 4. Test simulation performance under different network conditions
 * 5. Verify proper cleanup of animation frames and event listeners
 */

// Requirement: McKinsey Simulation - Page layout styling
const pageStyles = {
  container: cn(
    'flex flex-col gap-6 p-6',
    'min-h-screen bg-gray-50'
  ),
  header: cn(
    'flex flex-col gap-2'
  ),
  title: cn(
    'text-2xl font-bold text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-primary-500'
  ),
  description: cn(
    'text-gray-600'
  ),
  mainContent: cn(
    'grid gap-6',
    'grid-cols-1 lg:grid-cols-12'
  ),
  leftPanel: cn(
    'flex flex-col gap-4',
    'lg:col-span-4'
  ),
  rightPanel: cn(
    'lg:col-span-8'
  ),
  controls: cn(
    'flex gap-4 mt-4'
  ),
  button: cn(
    'px-4 py-2 rounded-md font-medium',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      primary: [
        'bg-primary-base text-white',
        'hover:bg-primary-hover',
        'active:bg-primary-active',
        'disabled:bg-primary-disabled'
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'active:bg-gray-300',
        'disabled:bg-gray-50 disabled:text-gray-400'
      ]
    }
  )
};

/**
 * SimulationPage component implementing the McKinsey ecosystem simulation game interface
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export default function SimulationPage(): JSX.Element {
  // Initialize simulation state and controls
  const {
    simulationState,
    loading,
    startSimulation,
    stopSimulation,
    resetSimulation
  } = useSimulation();

  /**
   * Handles starting the simulation with validation
   * Requirement: Simulation Engine - Handles ecosystem game logic
   */
  const handleStartSimulation = async () => {
    try {
      if (!simulationState) return;

      // Validate minimum species requirements
      const producerCount = simulationState.species.filter(s => s.type === 'PRODUCER').length;
      const consumerCount = simulationState.species.filter(s => s.type === 'CONSUMER').length;

      if (producerCount < 1 || consumerCount < 1) {
        throw new Error('At least one producer and one consumer species required');
      }

      await startSimulation();
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  /**
   * Handles stopping the simulation safely
   * Requirement: Simulation Engine - State management in frontend
   */
  const handleStopSimulation = async () => {
    try {
      await stopSimulation();
    } catch (error) {
      console.error('Failed to stop simulation:', error);
    }
  };

  return (
    <main className={pageStyles.container}>
      {/* Accessible header section */}
      <header className={pageStyles.header} role="banner">
        <h1 
          className={pageStyles.title}
          tabIndex={0}
        >
          Ecosystem Simulation
        </h1>
        <p className={pageStyles.description}>
          Configure and run ecosystem simulations with species selection and real-time visualization
        </p>
      </header>

      {/* Main simulation interface */}
      <div className={pageStyles.mainContent}>
        {/* Left panel: Species selection and simulation controls */}
        <div className={pageStyles.leftPanel}>
          <SpeciesSelector />
          
          <SimulationCard
            simulation={simulationState}
            loading={loading}
          />

          {/* Simulation controls */}
          <div 
            className={pageStyles.controls}
            role="group"
            aria-label="Simulation controls"
          >
            <button
              className={cn(pageStyles.button.primary)}
              onClick={handleStartSimulation}
              disabled={loading || !simulationState}
              aria-busy={loading}
            >
              Start Simulation
            </button>
            
            <button
              className={cn(pageStyles.button.secondary)}
              onClick={handleStopSimulation}
              disabled={loading || !simulationState}
              aria-busy={loading}
            >
              Stop Simulation
            </button>

            <button
              className={cn(pageStyles.button.secondary)}
              onClick={resetSimulation}
              disabled={loading}
              aria-busy={loading}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right panel: Ecosystem visualization */}
        <div 
          className={pageStyles.rightPanel}
          role="region"
          aria-label="Ecosystem visualization"
        >
          <EcosystemCanvas
            width={800}
            height={600}
          />
        </div>
      </div>
    </main>
  );
}