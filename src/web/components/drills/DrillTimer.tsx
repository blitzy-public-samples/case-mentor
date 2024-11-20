// Third-party imports
import React, { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0

// Internal imports
import { useDrill } from '../../hooks/useDrill';
import { Progress } from '../shared/Progress';

/**
 * Human Tasks:
 * 1. Test timer behavior under different network conditions
 * 2. Verify color contrast ratios for warning states
 * 3. Validate timer accuracy with automated tests
 * 4. Test cleanup behavior when component unmounts
 * 5. Verify ARIA labels with screen readers
 */

// Timer update interval in milliseconds
const TIMER_UPDATE_INTERVAL = 1000;

// Warning threshold in seconds
const WARNING_THRESHOLD = 60;

interface DrillTimerProps {
  // Duration in seconds
  duration: number;
  // Unique identifier for the drill
  drillId: string;
  // Callback when timer reaches zero
  onTimeUp: () => void;
  // Whether to start timer automatically
  autoStart?: boolean;
}

/**
 * Formats time in seconds to MM:SS display format
 * Requirement: User Experience - Clear time display format
 */
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Timer component for drill exercises with progress visualization
 * Requirement: Practice Drills - Implements time management functionality
 */
export const DrillTimer: React.FC<DrillTimerProps> = ({
  duration,
  drillId,
  onTimeUp,
  autoStart = false
}) => {
  // Initialize timer state
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Get drill submission function
  const { submitAttempt } = useDrill();

  /**
   * Handles timer completion
   * Requirement: McKinsey Simulation - Supports time-pressured scenarios
   */
  const handleTimeUp = useCallback(() => {
    setIsRunning(false);
    onTimeUp();
    // Submit attempt with time spent
    submitAttempt(drillId, '', duration);
  }, [drillId, duration, onTimeUp, submitAttempt]);

  /**
   * Timer effect with cleanup
   * Requirement: Practice Drills - Accurate countdown functionality
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalId);
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, TIMER_UPDATE_INTERVAL);
    }

    // Cleanup interval on unmount or when timer stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeRemaining, handleTimeUp]);

  // Calculate progress percentage
  const progressPercentage = (timeRemaining / duration) * 100;

  // Determine if in warning state
  const isWarning = timeRemaining <= WARNING_THRESHOLD;

  /**
   * Requirement: User Experience - Visual timer following design system
   */
  return (
    <div 
      className="flex flex-col gap-4"
      role="timer"
      aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
    >
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-mono text-2xl font-bold",
          isWarning && "text-error-base animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </span>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium",
            isRunning 
              ? "bg-error-base text-white hover:bg-error-hover"
              : "bg-secondary-base text-white hover:bg-secondary-hover"
          )}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>

      <Progress
        value={progressPercentage}
        max={100}
        variant={isWarning ? 'error' : 'primary'}
        size="md"
        ariaLabel={`${Math.round(progressPercentage)}% time remaining`}
      />
    </div>
  );
};

export default DrillTimer;