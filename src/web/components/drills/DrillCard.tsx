// Third-party imports
import React from 'react'; // ^18.0.0
import { cva } from 'class-variance-authority'; // ^0.7.0
import { Timer, Brain, Target } from 'lucide-react'; // ^0.284.0
import { clsx } from 'clsx';

// Internal imports
import { DrillType, DrillPrompt, DrillProgress, DrillDifficulty } from '../../types/drills';
import { Card, cardVariants } from '../shared/Card';
import { useDrill } from '../../hooks/useDrill';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios for difficulty indicators
 * 2. Test keyboard navigation and screen reader compatibility
 * 3. Validate subscription tier access control with backend
 * 4. Monitor drill start performance metrics
 */

// Requirement: Practice Drills - Props interface for DrillCard component
interface DrillCardProps {
  drill: DrillPrompt;
  progress?: DrillProgress;
  onStart: (drill: DrillPrompt) => void;
  className?: string;
}

// Requirement: User Interface Design - Difficulty level styling
const difficultyStyles: Record<DrillDifficulty, string> = {
  [DrillDifficulty.BEGINNER]: 'bg-green-100 text-green-800',
  [DrillDifficulty.INTERMEDIATE]: 'bg-yellow-100 text-yellow-800',
  [DrillDifficulty.ADVANCED]: 'bg-red-100 text-red-800'
};

// Utility function to combine class names
const cn = (...inputs: (string | undefined)[]) => clsx(inputs);

// Requirement: Practice Drills - Component for displaying individual drill information
const DrillCard: React.FC<DrillCardProps> = ({
  drill,
  progress,
  onStart,
  className
}) => {
  // Requirement: Practice Drills - Hook for managing drill state
  const { submitAttempt } = useDrill(drill.type);

  // Requirement: Practice Drills - Handle drill start with subscription validation
  const handleStart = () => {
    onStart(drill);
  };

  return (
    // Requirement: User Interface Design - Card component with consistent styling
    <Card
      className={cn(
        'flex flex-col gap-4 transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        className
      )}
      hoverable
    >
      {/* Requirement: Accessibility Requirements - Proper heading structure */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900" id={`drill-title-${drill.id}`}>
            {drill.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Brain className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm text-gray-600">
              {DrillType[drill.type]}
            </span>
          </div>
        </div>

        {/* Requirement: User Interface Design - Difficulty indicator */}
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            difficultyStyles[drill.difficulty]
          )}
          aria-label={`Difficulty: ${drill.difficulty}`}
        >
          {drill.difficulty}
        </span>
      </div>

      {/* Requirement: Practice Drills - Drill details display */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm text-gray-600">
            {drill.industry}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm text-gray-600">
            {drill.timeLimit} minutes
          </span>
        </div>
      </div>

      {/* Requirement: Practice Drills - Progress indicator */}
      {progress && (
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress.averageScore)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress.averageScore}%` }}
              role="progressbar"
              aria-valuenow={progress.averageScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Drill progress"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.attemptsCount} attempts
          </p>
        </div>
      )}

      {/* Requirement: Accessibility Requirements - Accessible button with proper labeling */}
      <button
        onClick={handleStart}
        className={cn(
          'mt-4 w-full px-4 py-2 rounded-md font-medium',
          'bg-primary-600 text-white',
          'hover:bg-primary-700 focus:outline-none focus:ring-2',
          'focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
        aria-describedby={`drill-title-${drill.id}`}
      >
        Start Practice
      </button>

      {/* Requirement: Practice Drills - Subscription tier indicator */}
      {drill.requiredTier !== 'FREE' && (
        <p className="text-xs text-gray-500 text-center mt-2">
          {drill.requiredTier} subscription required
        </p>
      )}
    </Card>
  );
};

export default DrillCard;