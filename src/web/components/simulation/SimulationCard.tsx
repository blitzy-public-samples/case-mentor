// Third-party imports
import React from 'react'; // ^18.0.0
import { cva } from 'class-variance-authority'; // ^0.7.0
import { format } from 'date-fns'; // ^2.30.0

// Internal imports
import { SimulationState, SimulationStatus, Species, EnvironmentParameters } from '../../types/simulation';
import { Card, cardVariants } from '../shared/Card';
import { useSimulation } from '../../hooks/useSimulation';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards
 * 2. Test focus states across different browsers and color schemes
 * 3. Validate environment parameter ranges with domain experts
 * 4. Test screen reader compatibility for status indicators
 */

// Props interface for SimulationCard component
interface SimulationCardProps {
  simulation: SimulationState;
  loading: boolean;
  className?: string;
}

// Utility function for merging class names
const cn = (...inputs: (string | boolean | undefined | null | { [key: string]: boolean | undefined })[]) => {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ');
};

/**
 * A card component that displays simulation state and controls with accessibility features
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
const SimulationCard: React.FC<SimulationCardProps> = ({
  simulation,
  loading,
  className
}) => {
  /**
   * Renders the current simulation status with appropriate styling
   * Requirement: UI Components - Core card component for displaying simulation state
   */
  const renderStatus = () => {
    const statusClasses = cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      {
        'bg-blue-100 text-blue-800': simulation.status === SimulationStatus.SETUP,
        'bg-green-100 text-green-800 animate-pulse': simulation.status === SimulationStatus.RUNNING,
        'bg-purple-100 text-purple-800': simulation.status === SimulationStatus.COMPLETED,
        'bg-red-100 text-red-800': simulation.status === SimulationStatus.FAILED
      }
    );

    return (
      <div className="flex items-center space-x-2" role="status" aria-live="polite">
        <span className={statusClasses}>
          {simulation.status}
        </span>
        {simulation.timeRemaining > 0 && (
          <span className="text-sm text-gray-600">
            {format(simulation.timeRemaining * 1000, 'mm:ss')} remaining
          </span>
        )}
      </div>
    );
  };

  /**
   * Renders the environment parameters section
   * Requirement: McKinsey Simulation - Complex data analysis
   */
  const renderEnvironment = () => {
    const formatEnvironmentValue = (parameter: keyof EnvironmentParameters, value: number): string => {
      switch (parameter) {
        case 'temperature':
          return `${value.toFixed(1)}°C`;
        case 'depth':
          return `${value.toFixed(1)}m`;
        case 'salinity':
          return `${value.toFixed(1)}‰`;
        case 'lightLevel':
          return `${value.toFixed(1)}%`;
        default:
          return `${value}`;
      }
    };

    return (
      <div className="grid grid-cols-2 gap-4 mt-4" role="region" aria-label="Environment Parameters">
        {Object.entries(simulation.environment).map(([parameter, value]) => (
          <div key={parameter} className="flex flex-col">
            <span className="text-sm text-gray-600 capitalize">
              {parameter.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span className="text-lg font-medium">
              {formatEnvironmentValue(parameter as keyof EnvironmentParameters, value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders the list of selected species
   * Requirement: McKinsey Simulation - Ecosystem game replication
   */
  const renderSpecies = () => {
    const speciesByType = simulation.species.reduce((acc, species) => {
      const type = species.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(species);
      return acc;
    }, {} as Record<string, Species[]>);

    return (
      <div className="mt-4" role="region" aria-label="Selected Species">
        {Object.entries(speciesByType).map(([type, speciesList]) => (
          <div key={type} className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {type} ({speciesList.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {speciesList.map((species) => (
                <span
                  key={species.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  role="listitem"
                >
                  {species.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'w-full transition-opacity',
        loading && 'opacity-75',
        className
      )}
      shadow="md"
      hoverable={false}
      aria-busy={loading}
    >
      <div className="space-y-4">
        {renderStatus()}
        {renderEnvironment()}
        {renderSpecies()}
      </div>
    </Card>
  );
};

export default SimulationCard;