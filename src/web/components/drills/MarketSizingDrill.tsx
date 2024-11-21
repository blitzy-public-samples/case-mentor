// Third-party imports
import React, { useState, useCallback } from 'react'; // ^18.0.0
import { clsx } from 'clsx'; // Using clsx instead of cn from class-variance-authority

// Internal imports
import { DrillType, DrillPrompt, DrillAttempt } from '../../types/drills';
import { useDrill } from '../../hooks/useDrill';
import { Input } from '../shared/Input';
import { DrillTimer } from './DrillTimer';

/**
 * Human Tasks:
 * 1. Verify assumption ranges with product team for validation logic
 * 2. Test timer behavior under different network conditions
 * 3. Validate calculation accuracy with test cases
 * 4. Ensure proper cleanup on component unmount
 * 5. Test error state handling with screen readers
 */

// Default assumptions for market sizing calculations
const DEFAULT_ASSUMPTIONS: Record<string, number> = {
  population: 0,
  penetration: 0,
  frequency: 0,
  price: 0
};

// Labels for assumption inputs with hints
const ASSUMPTION_LABELS: Record<string, { label: string; hint: string }> = {
  population: {
    label: 'Total Population',
    hint: 'Enter the total addressable population'
  },
  penetration: {
    label: 'Market Penetration (%)',
    hint: 'Enter percentage of population that uses the product'
  },
  frequency: {
    label: 'Purchase Frequency',
    hint: 'Enter average purchases per year per customer'
  },
  price: {
    label: 'Average Price ($)',
    hint: 'Enter average price per unit in USD'
  }
};

interface MarketSizingDrillProps {
  prompt: DrillPrompt;
  onComplete: (attempt: DrillAttempt) => void;
}

/**
 * Market sizing drill component for practicing structured market size estimation
 * Requirement: Practice Drills - Market Sizing Drills component for practicing structured market size estimation
 */
export const MarketSizingDrill: React.FC<MarketSizingDrillProps> = ({
  prompt,
  onComplete
}) => {
  // Initialize state for assumptions
  const [assumptions, setAssumptions] = useState<Record<string, number>>(DEFAULT_ASSUMPTIONS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Get drill submission function from hook
  const { submitAttempt } = useDrill(DrillType.MARKET_SIZING);

  /**
   * Validates individual assumption input
   * Requirement: Practice Drills - Step-by-step validation and feedback
   */
  const validateAssumption = useCallback((key: string, value: number): string | null => {
    switch (key) {
      case 'population':
        if (value <= 0) return 'Population must be greater than 0';
        if (value > 8_000_000_000) return 'Population exceeds world population';
        break;
      case 'penetration':
        if (value < 0 || value > 100) return 'Penetration must be between 0 and 100';
        break;
      case 'frequency':
        if (value < 0) return 'Frequency must be greater than 0';
        if (value > 365) return 'Frequency exceeds days in year';
        break;
      case 'price':
        if (value < 0) return 'Price must be greater than 0';
        if (value > 1_000_000) return 'Price exceeds reasonable limit';
        break;
    }
    return null;
  }, []);

  /**
   * Handles assumption input changes with validation
   * Requirement: Practice Drills - Real-time validation
   */
  const handleAssumptionChange = useCallback((key: string, value: string) => {
    const numericValue = parseFloat(value);
    const error = validateAssumption(key, numericValue);
    
    setErrors(prev => ({
      ...prev,
      [key]: error || ''
    }));

    setAssumptions(prev => ({
      ...prev,
      [key]: isNaN(numericValue) ? 0 : numericValue
    }));
  }, [validateAssumption]);

  /**
   * Calculates final market size from assumptions
   * Requirement: Practice Drills - Market size calculation logic
   */
  const calculateMarketSize = useCallback((): number => {
    const { population, penetration, frequency, price } = assumptions;
    const penetrationRate = penetration / 100; // Convert percentage to decimal
    return population * penetrationRate * frequency * price;
  }, [assumptions]);

  /**
   * Handles drill completion and submission
   * Requirement: User Management - Tracks user progress and performance
   */
  const handleComplete = useCallback(async () => {
    setIsCalculating(true);
    try {
      const marketSize = calculateMarketSize();
      const workings = {
        assumptions,
        marketSize,
        steps: [
          `Total Population: ${assumptions.population.toLocaleString()}`,
          `Market Penetration: ${assumptions.penetration}%`,
          `Purchase Frequency: ${assumptions.frequency} times per year`,
          `Average Price: $${assumptions.price}`,
          `Final Market Size: $${marketSize.toLocaleString()}`
        ]
      };

      const result = await submitAttempt(prompt.id, JSON.stringify(workings), 0);
      // Cast the result to DrillAttempt since we know the structure matches
      onComplete(result as unknown as DrillAttempt);
    } catch (error) {
      console.error('Error submitting market sizing attempt:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [assumptions, calculateMarketSize, onComplete, prompt.id, submitAttempt]);

  /**
   * Validates all assumptions before submission
   * Requirement: Practice Drills - Comprehensive validation
   */
  const isValid = useCallback((): boolean => {
    return Object.keys(assumptions).every(key => {
      const error = validateAssumption(key, assumptions[key]);
      return !error && assumptions[key] > 0;
    });
  }, [assumptions, validateAssumption]);

  return (
    <div className="space-y-6">
      {/* Timer component */}
      <DrillTimer
        duration={prompt.timeLimit}
        drillId={prompt.id}
        onTimeUp={handleComplete}
        autoStart={true}
        drillType={DrillType.MARKET_SIZING}
      />

      {/* Assumption inputs */}
      <div className="space-y-4">
        {Object.entries(ASSUMPTION_LABELS).map(([key, { label, hint }]) => (
          <Input
            key={key}
            type="number"
            label={label}
            hint={hint}
            value={assumptions[key] || ''}
            onChange={(e) => handleAssumptionChange(key, e.target.value)}
            error={errors[key]}
            min={0}
            step={key === 'penetration' ? '0.1' : '1'}
            className="w-full"
          />
        ))}
      </div>

      {/* Market size calculation and submission */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">
          Market Size: ${calculateMarketSize().toLocaleString()}
        </div>

        <button
          onClick={handleComplete}
          disabled={!isValid() || isCalculating}
          className={clsx(
            "w-full px-4 py-2 text-white rounded-md transition-colors",
            isValid() && !isCalculating
              ? "bg-primary-base hover:bg-primary-hover"
              : "bg-gray-300 cursor-not-allowed"
          )}
        >
          {isCalculating ? 'Calculating...' : 'Submit Market Sizing'}
        </button>
      </div>
    </div>
  );
};

export default MarketSizingDrill;