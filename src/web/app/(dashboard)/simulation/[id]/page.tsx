'use client';

// Third-party imports
import React, { Suspense } from 'react'; // ^18.0.0

// Internal imports
import EcosystemCanvas from '../../../components/simulation/EcosystemCanvas';
import EcosystemControls from '../../../components/simulation/EcosystemControls';
import SimulationResults from '../../../components/simulation/SimulationResults';
import { useSimulation } from '../../../hooks/useSimulation';

// Global constants for canvas dimensions
const SIMULATION_CANVAS_WIDTH = 1024;
const SIMULATION_CANVAS_HEIGHT = 768;

/**
 * Human Tasks:
 * 1. Verify ARIA labels and roles with screen reader testing
 * 2. Test responsive layout across different screen sizes
 * 3. Validate loading states with slow network conditions
 * 4. Ensure proper error boundary configuration in production
 */

/**
 * Main page component for the McKinsey ecosystem simulation game
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export default function SimulationPage({ params }: { params: { id: string } }): JSX.Element {
  // Initialize simulation state and controls
  const {
    simulationState,
    simulationResult,
    loading,
    error,
    resetSimulation
  } = useSimulation();

  // Loading state with WCAG compliant spinner
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading simulation"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-base">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state with accessible error message
  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen p-4"
        role="alert"
        aria-live="assertive"
      >
        <h1 className="text-2xl font-bold text-error-base mb-4">
          Simulation Error
        </h1>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={resetSimulation}
          className="px-4 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-hover"
          aria-label="Try again"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Requirement: McKinsey Simulation - Complex data analysis
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 
          className="text-3xl font-bold text-gray-900"
          aria-label="Ecosystem Simulation"
        >
          Ecosystem Simulation
        </h1>
      </header>

      <main>
        {/* Simulation interface with proper ARIA roles */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          role="main"
          aria-label="Simulation interface"
        >
          {/* Controls section */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading controls...</div>}>
              <EcosystemControls 
                className="sticky top-4"
              />
            </Suspense>
          </div>

          {/* Canvas section */}
          <div className="lg:col-span-2">
            <Suspense fallback={<div>Loading simulation...</div>}>
              <div 
                className="relative rounded-lg overflow-hidden"
                role="region"
                aria-label="Simulation visualization"
              >
                <EcosystemCanvas
                  width={SIMULATION_CANVAS_WIDTH}
                  height={SIMULATION_CANVAS_HEIGHT}
                  className="w-full h-auto"
                />
              </div>
            </Suspense>
          </div>
        </div>

        {/* Results section */}
        {simulationResult && (
          <div 
            className="mt-8"
            role="complementary"
            aria-label="Simulation results"
          >
            <Suspense fallback={<div>Loading results...</div>}>
              <SimulationResults
                result={simulationResult}
                onReset={resetSimulation}
              />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  );
}