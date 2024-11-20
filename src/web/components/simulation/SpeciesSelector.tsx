/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated testing tools
 * 2. Test keyboard navigation with screen readers
 * 3. Validate color contrast ratios for all states
 * 4. Test species selection limits under different scenarios
 * 5. Verify real-time validation feedback with screen readers
 */

// Third-party imports
import React, { useCallback, useMemo } from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0

// Internal imports
import { Species, SpeciesType, SimulationValidation } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import { Select } from '../shared/Select';

// Constants for species limits
const PRODUCER_LIMIT = 3;
const CONSUMER_LIMIT = 5;

// Requirement: McKinsey Simulation - Component styling using theme tokens
const selectorStyles = {
  container: cn(
    'flex flex-col gap-6 p-4 rounded-lg border border-gray-200',
    'bg-white shadow-sm'
  ),
  section: cn(
    'flex flex-col gap-2'
  ),
  heading: cn(
    'text-lg font-semibold text-gray-900'
  ),
  selectionArea: cn(
    'flex flex-col gap-4'
  ),
  validationMessage: cn(
    'text-sm',
    'text-error-base'
  )
};

// Props interface for the SpeciesSelector component
interface SpeciesSelectorProps {
  className?: string;
}

/**
 * Helper function to format species data for Select component with accessibility support
 * Requirement: McKinsey Simulation - Complex data analysis
 */
const getSpeciesOptions = (
  species: Species[],
  selectedSpecies: Species[],
  type: SpeciesType
) => {
  const typeLimit = type === SpeciesType.PRODUCER ? PRODUCER_LIMIT : CONSUMER_LIMIT;
  const currentTypeCount = selectedSpecies.filter(s => s.type === type).length;
  const isAtLimit = currentTypeCount >= typeLimit;

  return species
    .filter(s => s.type === type)
    .map(s => ({
      value: s.id,
      label: `${s.name} (Energy: ${s.energyRequirement})`,
      disabled: isAtLimit && !selectedSpecies.find(selected => selected.id === s.id)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * SpeciesSelector component for the McKinsey ecosystem simulation game
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export function SpeciesSelector({ className }: SpeciesSelectorProps): JSX.Element {
  // Get simulation state and methods from hook
  const { simulationState, addSpecies, removeSpecies } = useSimulation();

  // Memoize available and selected species
  const availableSpecies = useMemo(() => {
    return simulationState?.species || [];
  }, [simulationState?.species]);

  const selectedSpecies = useMemo(() => {
    return simulationState?.species || [];
  }, [simulationState?.species]);

  /**
   * Handle species selection
   * Requirement: Simulation Engine - Handles ecosystem game logic
   */
  const handleSpeciesSelect = useCallback(async (speciesId: string, type: SpeciesType) => {
    const species = availableSpecies.find(s => s.id === speciesId);
    if (!species) return;

    try {
      // Validate species data before adding
      const validationResult = SimulationValidation.speciesSchema.safeParse(species);
      if (!validationResult.success) {
        throw new Error('Invalid species data');
      }

      await addSpecies(species);
    } catch (error) {
      console.error('Species selection error:', error);
    }
  }, [availableSpecies, addSpecies]);

  /**
   * Handle species removal
   * Requirement: Simulation Engine - State management in frontend
   */
  const handleSpeciesRemove = useCallback((speciesId: string) => {
    removeSpecies(speciesId);
  }, [removeSpecies]);

  // Calculate remaining slots for each species type
  const producerCount = selectedSpecies.filter(s => s.type === SpeciesType.PRODUCER).length;
  const consumerCount = selectedSpecies.filter(s => s.type === SpeciesType.CONSUMER).length;
  const producerRemaining = PRODUCER_LIMIT - producerCount;
  const consumerRemaining = CONSUMER_LIMIT - consumerCount;

  return (
    <div className={cn(selectorStyles.container, className)}>
      {/* Producers Section */}
      <section className={selectorStyles.section}>
        <h2 className={selectorStyles.heading}>
          Producers ({producerCount}/{PRODUCER_LIMIT})
        </h2>
        <div className={selectorStyles.selectionArea}>
          <Select
            value=""
            options={getSpeciesOptions(availableSpecies, selectedSpecies, SpeciesType.PRODUCER)}
            onChange={(value) => handleSpeciesSelect(value, SpeciesType.PRODUCER)}
            placeholder="Select producer species"
            disabled={producerCount >= PRODUCER_LIMIT}
            error={producerCount >= PRODUCER_LIMIT ? 'Producer limit reached' : undefined}
          />
          {producerRemaining > 0 && (
            <span className="text-sm text-gray-600">
              Add {producerRemaining} more producer{producerRemaining !== 1 ? 's' : ''} to continue
            </span>
          )}
        </div>
      </section>

      {/* Consumers Section */}
      <section className={selectorStyles.section}>
        <h2 className={selectorStyles.heading}>
          Consumers ({consumerCount}/{CONSUMER_LIMIT})
        </h2>
        <div className={selectorStyles.selectionArea}>
          <Select
            value=""
            options={getSpeciesOptions(availableSpecies, selectedSpecies, SpeciesType.CONSUMER)}
            onChange={(value) => handleSpeciesSelect(value, SpeciesType.CONSUMER)}
            placeholder="Select consumer species"
            disabled={consumerCount >= CONSUMER_LIMIT}
            error={consumerCount >= CONSUMER_LIMIT ? 'Consumer limit reached' : undefined}
          />
          {consumerRemaining > 0 && (
            <span className="text-sm text-gray-600">
              Add {consumerRemaining} more consumer{consumerRemaining !== 1 ? 's' : ''} to continue
            </span>
          )}
        </div>
      </section>

      {/* Validation Messages */}
      {producerCount < 1 && (
        <p className={selectorStyles.validationMessage}>
          At least 1 producer species is required
        </p>
      )}
      {consumerCount < 1 && (
        <p className={selectorStyles.validationMessage}>
          At least 1 consumer species is required
        </p>
      )}
    </div>
  );
}