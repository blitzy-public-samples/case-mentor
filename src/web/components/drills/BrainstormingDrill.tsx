// Third-party imports
import React, { useState, useCallback, useRef } from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0

// Internal imports
import { DrillType, DrillPrompt, DrillAttempt } from '../../types/drills';
import { useDrill } from '../../hooks/useDrill';
import { Button, buttonVariants } from '../shared/Button';
import DrillTimer from './DrillTimer';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated accessibility testing tools
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate form submission behavior under different network conditions
 * 4. Review error message content with UX team
 * 5. Test timer behavior with different subscription tiers
 */

// Constants for idea validation
const MIN_IDEAS_REQUIRED = 5;
const MAX_IDEAS_ALLOWED = 20;
const IDEA_INPUT_PLACEHOLDER = 'Enter your idea here...';
const MIN_IDEA_LENGTH = 5;
const MAX_IDEA_LENGTH = 200;

interface BrainstormingDrillProps {
  prompt: DrillPrompt;
  onComplete: (attempt: DrillAttempt) => void;
}

interface BrainstormingIdea {
  id: string;
  content: string;
  timestamp: Date;
}

/**
 * BrainstormingDrill component for practicing structured idea generation
 * Requirement: Practice Drills - Implements Brainstorming Drills functionality
 */
export const BrainstormingDrill: React.FC<BrainstormingDrillProps> = ({
  prompt,
  onComplete
}) => {
  // State management
  const [ideas, setIdeas] = useState<BrainstormingIdea[]>([]);
  const [currentIdea, setCurrentIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const { submitAttempt } = useDrill();

  /**
   * Validates a single idea
   * Requirement: Practice Drills - Input validation for brainstorming ideas
   */
  const validateIdea = (idea: string): string | null => {
    if (idea.length < MIN_IDEA_LENGTH) {
      return `Ideas must be at least ${MIN_IDEA_LENGTH} characters long`;
    }
    if (idea.length > MAX_IDEA_LENGTH) {
      return `Ideas cannot exceed ${MAX_IDEA_LENGTH} characters`;
    }
    if (ideas.some(existing => existing.content.toLowerCase() === idea.toLowerCase())) {
      return 'This idea has already been added';
    }
    return null;
  };

  /**
   * Handles adding new ideas to the list
   * Requirement: Practice Drills - Structured idea collection
   */
  const handleAddIdea = useCallback(() => {
    const trimmedIdea = currentIdea.trim();
    const validationError = validateIdea(trimmedIdea);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (ideas.length >= MAX_IDEAS_ALLOWED) {
      setError(`Maximum of ${MAX_IDEAS_ALLOWED} ideas allowed`);
      return;
    }

    const newIdea: BrainstormingIdea = {
      id: crypto.randomUUID(),
      content: trimmedIdea,
      timestamp: new Date()
    };

    setIdeas(prev => [...prev, newIdea]);
    setCurrentIdea('');
    setError(null);

    // Focus back on input for continuous ideation
    inputRef.current?.focus();
  }, [currentIdea, ideas]);

  /**
   * Handles idea removal
   * Requirement: Practice Drills - Idea management functionality
   */
  const handleRemoveIdea = useCallback((idToRemove: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== idToRemove));
  }, []);

  /**
   * Handles drill submission
   * Requirement: User Management - Tracks user progress and performance
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (ideas.length < MIN_IDEAS_REQUIRED) {
      setError(`Please add at least ${MIN_IDEAS_REQUIRED} ideas`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const attempt: Partial<DrillAttempt> = {
        promptId: prompt.id,
        response: JSON.stringify(ideas),
        timeSpent: prompt.timeLimit * 60 // Convert to seconds
      };

      const result = await submitAttempt(prompt.id, attempt.response!, attempt.timeSpent!);

      if (result.success) {
        onComplete(result.data as DrillAttempt);
      } else {
        throw new Error(result.error?.message || 'Failed to submit attempt');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit drill attempt');
    } finally {
      setIsSubmitting(false);
    }
  }, [ideas, prompt, submitAttempt, onComplete]);

  /**
   * Handles timer expiration
   * Requirement: Practice Drills - Time management
   */
  const handleTimeUp = useCallback(() => {
    if (ideas.length >= MIN_IDEAS_REQUIRED) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    } else {
      setError(`Time's up! You need at least ${MIN_IDEAS_REQUIRED} ideas to submit.`);
    }
  }, [ideas.length, handleSubmit]);

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-md">
      {/* Drill prompt section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{prompt.title}</h2>
        <p className="text-gray-700">{prompt.description}</p>
      </div>

      {/* Timer section */}
      <DrillTimer
        duration={(prompt.timeLimit || 0) * 60} // Convert minutes to seconds, default to 0 if undefined
        drillId={prompt.id}
        onTimeUp={handleTimeUp}
        autoStart={true}
      />

      {/* Ideas input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="ideaInput"
            className="block text-sm font-medium text-gray-700"
          >
            Add your ideas ({ideas.length}/{MAX_IDEAS_ALLOWED})
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="ideaInput"
              type="text"
              value={currentIdea}
              onChange={(e) => setCurrentIdea(e.target.value)}
              placeholder={IDEA_INPUT_PLACEHOLDER}
              className={cn(
                "flex-1 min-w-0 rounded-md border-gray-300 shadow-sm",
                "focus:border-primary-base focus:ring-primary-base",
                "disabled:bg-gray-100 disabled:cursor-not-allowed"
              )}
              maxLength={MAX_IDEA_LENGTH}
              disabled={ideas.length >= MAX_IDEAS_ALLOWED || isSubmitting}
              aria-invalid={!!error}
              aria-describedby={error ? "ideaError" : undefined}
            />
            <Button
              type="button"
              onClick={handleAddIdea}
              disabled={!currentIdea.trim() || ideas.length >= MAX_IDEAS_ALLOWED || isSubmitting}
              variant="secondary"
              size="md"
              ariaLabel="Add idea"
            >
              Add
            </Button>
          </div>
          {error && (
            <p id="ideaError" className="text-sm text-error-base" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Ideas list */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Your Ideas ({MIN_IDEAS_REQUIRED} minimum required)
          </h3>
          <ul className="space-y-2" role="list">
            {ideas.map((idea) => (
              <li
                key={idea.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <span className="text-gray-700">{idea.content}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIdea(idea.id)}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    "text-error-base hover:text-error-hover"
                  )}
                  disabled={isSubmitting}
                  aria-label={`Remove idea: ${idea.content}`}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={ideas.length < MIN_IDEAS_REQUIRED || isSubmitting}
          className="w-full"
          ariaLabel="Submit brainstorming drill"
        >
          Submit {ideas.length}/{MIN_IDEAS_REQUIRED} Ideas
        </Button>
      </form>
    </div>
  );
};

export default BrainstormingDrill;