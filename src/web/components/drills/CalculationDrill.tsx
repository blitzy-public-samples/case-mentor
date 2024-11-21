// Third-party imports
import React, { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { clsx } from 'clsx'; // Using clsx instead of cn from class-variance-authority

// Internal imports
import { DrillTimer } from './DrillTimer';
import { Input } from '../shared/Input';
import { useDrill } from '../../hooks/useDrill';
import { DrillType } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Verify calculation validation thresholds with product team
 * 2. Test numeric input behavior across different locales
 * 3. Validate timer performance under heavy CPU load
 * 4. Test ARIA labels with screen readers
 * 5. Verify error margin calculations with business requirements
 */

// Time limit for calculation drills in seconds
const CALCULATION_TIME_LIMIT = 300; // 5 minutes

// Acceptable error margin for calculations (5%)
const ACCEPTABLE_ERROR_MARGIN = 0.05;

interface CalculationDrillProps {
  drillId: string;
  prompt: {
    id: string;
    type: DrillType;
    title: string;
    description: string;
    expectedAnswer: number;
  };
  onComplete: () => void;
}

/**
 * Validates user's calculation input against expected answer
 * Requirement: Case Math Drills - Implements calculation validation with acceptable margin of error
 */
const validateCalculation = (input: string, expectedAnswer: number): boolean => {
  try {
    const numericInput = parseFloat(input);
    if (isNaN(numericInput)) return false;

    const absoluteDifference = Math.abs(numericInput - expectedAnswer);
    const relativeDifference = absoluteDifference / expectedAnswer;

    return relativeDifference <= ACCEPTABLE_ERROR_MARGIN;
  } catch (error) {
    console.error('Calculation validation error:', error);
    return false;
  }
};

/**
 * Calculation drill component for practicing quantitative analysis
 * Requirement: Case Math Drills - Implements calculation drills for business case scenarios
 */
export const CalculationDrill: React.FC<CalculationDrillProps> = ({
  drillId,
  prompt,
  onComplete
}) => {
  // Initialize state for calculation input
  const [input, setInput] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Get drill submission function from hook
  const { submitAttempt } = useDrill(DrillType.CALCULATION);

  /**
   * Handles input changes with validation
   * Requirement: User Engagement - Interactive calculation interface
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input with decimals
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setInput(value);
      if (value) {
        // Validate input in real-time
        const correct = validateCalculation(value, prompt.expectedAnswer);
        setIsCorrect(correct);
      } else {
        setIsCorrect(null);
      }
    }
  }, [prompt.expectedAnswer]);

  /**
   * Handles drill completion
   * Requirement: System Performance - Ensures <200ms response time for validation
   */
  const handleComplete = useCallback(async () => {
    try {
      // Submit attempt with time tracking
      await submitAttempt(drillId, input, timeSpent);
      onComplete();
    } catch (error) {
      console.error('Failed to submit calculation attempt:', error);
    }
  }, [drillId, input, timeSpent, submitAttempt, onComplete]);

  /**
   * Handles timer completion
   * Requirement: Case Math Drills - Time-constrained calculations
   */
  const handleTimeUp = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Update time spent when input changes
  useEffect(() => {
    if (input && isCorrect) {
      const elapsed = CALCULATION_TIME_LIMIT - timeSpent;
      setTimeSpent(elapsed);
    }
  }, [input, isCorrect, timeSpent]);

  return (
    <div className="space-y-6">
      {/* Timer component */}
      <DrillTimer
        duration={CALCULATION_TIME_LIMIT}
        drillId={drillId}
        onTimeUp={handleTimeUp}
        autoStart={true}
        drillType={DrillType.CALCULATION}
      />

      {/* Calculation prompt */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold mb-4">
          {prompt.title}
        </h3>
        <p className="text-gray-700 mb-6">
          {prompt.description}
        </p>

        {/* Numeric input with validation */}
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your calculation"
          aria-label="Calculation input"
          label="Your Answer"
          hint="Enter numeric values only. Decimals are allowed."
          error={input && !isCorrect ? "Incorrect. Please check your calculation." : undefined}
          className={clsx(
            "text-lg font-mono",
            isCorrect && "border-green-500 focus:ring-green-500",
            input && !isCorrect && "border-red-500 focus:ring-red-500"
          )}
        />
      </div>

      {/* Real-time feedback */}
      {input && (
        <div
          className={clsx(
            "p-4 rounded-md",
            isCorrect 
              ? "bg-green-50 text-green-700" 
              : "bg-red-50 text-red-700"
          )}
          role="alert"
        >
          <p className="font-medium">
            {isCorrect 
              ? "Correct! Well done." 
              : "Keep trying. Check your calculations."}
          </p>
        </div>
      )}
    </div>
  );
};

export default CalculationDrill;