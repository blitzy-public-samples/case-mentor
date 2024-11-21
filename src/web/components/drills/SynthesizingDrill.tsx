// Third-party imports
import React, { useState, useEffect, useCallback } from 'react'; // ^18.0.0

// Internal imports
import { buttonVariants } from '../shared/Button';
import { cardVariants } from '../shared/Card';
import { Input } from '../shared/Input';
import { useDrill } from '../../hooks/useDrill';
import { DrillType } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with accessibility testing tools
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate color contrast ratios for all interactive elements
 * 4. Review focus management during drill state transitions
 */

// Requirement: Practice Drills - Props interface for synthesizing drill component
interface SynthesizingDrillProps {
  drillId: string;
  onComplete: () => void;
}

// Requirement: Practice Drills - Main synthesizing drill component implementation
export const SynthesizingDrill: React.FC<SynthesizingDrillProps> = ({
  drillId,
  onComplete
}) => {
  // Initialize drill state with useDrill hook
  const {
    drills,
    loading,
    error,
    submitAttempt,
    progress
  } = useDrill(DrillType.SYNTHESIZING);

  // Local state management
  const [response, setResponse] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Get current drill from drills array
  const currentDrill = drills.find(drill => drill.id === drillId);

  // Requirement: User Interface Design - Timer implementation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Requirement: Practice Drills - Response validation
  const validateResponse = useCallback((text: string): boolean => {
    // Minimum length check
    if (text.length < 100) {
      return false;
    }

    // Check for key components of synthesis
    const hasConclusion = text.toLowerCase().includes('conclusion');
    const hasSupporting = text.toLowerCase().includes('because') || 
                         text.toLowerCase().includes('therefore');
    const hasStructure = text.split('\n').length > 3;

    return hasConclusion && hasSupporting && hasStructure;
  }, []);

  // Requirement: Practice Drills - Handle drill submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateResponse(response)) {
      setFeedback('Please provide a more comprehensive response with clear conclusions and supporting evidence.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAttempt(drillId, response, timeSpent);
      
      if (result.success) {
        onComplete();
      } else {
        setFeedback(typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to submit response. Please try again.');
      }
    } catch (error) {
      setFeedback('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Requirement: User Interface Design - Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Requirement: User Interface Design - Error state
  if (error || !currentDrill) {
    return (
      <div className={cardVariants({ shadow: 'sm' })}>
        <div className="p-4 text-center text-red-500">
          {error || 'Drill not found'}
        </div>
      </div>
    );
  }

  // Requirement: User Interface Design - Main drill interface
  return (
    <div className="space-y-6">
      {/* Requirement: Accessibility Requirements - Semantic structure */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Synthesizing Exercise
        </h1>
        <p className="text-sm text-gray-500">
          Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
        </p>
      </header>

      {/* Requirement: User Interface Design - Drill content presentation */}
      <div className={cardVariants({ shadow: 'md', padding: 'lg' })}>
        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-4">
            {currentDrill.title}
          </h2>
          <p className="text-gray-700 mb-6">
            {currentDrill.description}
          </p>
        </div>

        {/* Requirement: Accessibility Requirements - Form labeling */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="response"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Synthesis
            </label>
            <textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full min-h-[200px] p-3 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your synthesized response here..."
              aria-describedby="responseHint"
              disabled={isSubmitting}
            />
            <p id="responseHint" className="mt-2 text-sm text-gray-500">
              Provide a clear synthesis with structured conclusions and supporting evidence.
            </p>
          </div>

          {/* Requirement: User Interface Design - Feedback display */}
          {feedback && (
            <div
              role="alert"
              className="p-4 rounded-md bg-red-50 text-red-700 text-sm"
            >
              {feedback}
            </div>
          )}

          {/* Requirement: User Interface Design - Action buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className={buttonVariants({
                variant: 'ghost',
                size: 'lg'
              })}
              onClick={() => setResponse('')}
              disabled={isSubmitting || !response}
            >
              Clear
            </button>
            <button
              type="submit"
              className={buttonVariants({
                variant: 'primary',
                size: 'lg'
              })}
              disabled={isSubmitting || !response}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      </div>

      {/* Requirement: User Interface Design - Progress indicator */}
      {progress && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Your Progress
          </h3>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-500"
              style={{ width: `${(progress.attemptsCount / 10) * 100}%` }}
              role="progressbar"
              aria-valuenow={progress.attemptsCount}
              aria-valuemin={0}
              aria-valuemax={10}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {progress.attemptsCount} of 10 synthesizing drills completed
          </p>
        </div>
      )}
    </div>
  );
};