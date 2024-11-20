// Third-party imports
import React, { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { cn } from 'class-variance-authority'; // ^0.7.0

// Internal imports
import { DrillType, DrillPrompt, DrillAttempt, DrillFeedback } from '../../types/drills';
import { useDrill } from '../../hooks/useDrill';
import DrillTimer from './DrillTimer';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with accessibility testing tools
 * 2. Test response validation with screen readers
 * 3. Validate timer behavior under different network conditions
 * 4. Review error message clarity with UX team
 * 5. Test auto-save functionality with poor network connectivity
 */

// Response length constraints
const MIN_RESPONSE_LENGTH = 100;
const MAX_RESPONSE_LENGTH = 5000;

// Auto-save interval in milliseconds
const AUTO_SAVE_INTERVAL = 30000;

interface CasePromptDrillProps {
  promptId: string;
  onComplete: (attempt: DrillAttempt) => void;
}

/**
 * Case prompt drill component for practicing case interview responses
 * Requirement: Case Prompt Drills - Implementation of case prompt practice functionality
 */
export const CasePromptDrill: React.FC<CasePromptDrillProps> = ({
  promptId,
  onComplete
}) => {
  // Initialize drill hook
  const { drills, submitAttempt, loading, error } = useDrill(DrillType.CASE_PROMPT);

  // Component state
  const [response, setResponse] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Get current drill prompt
  const currentPrompt = drills.find(drill => drill.id === promptId);

  /**
   * Validates response length against constraints
   * Requirement: User Engagement - Clear validation feedback
   */
  const validateResponse = useCallback((text: string): boolean => {
    if (text.length < MIN_RESPONSE_LENGTH) {
      setValidationError(`Response must be at least ${MIN_RESPONSE_LENGTH} characters`);
      return false;
    }
    if (text.length > MAX_RESPONSE_LENGTH) {
      setValidationError(`Response cannot exceed ${MAX_RESPONSE_LENGTH} characters`);
      return false;
    }
    setValidationError('');
    return true;
  }, []);

  /**
   * Handles response submission
   * Requirement: Case Prompt Drills - Structured response format and evaluation
   */
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!validateResponse(response)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAttempt(promptId, response, timeSpent);
      
      if (result.success && result.data) {
        const attempt = result.data as DrillAttempt;
        setFeedback(attempt.feedback);
        onComplete(attempt);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setValidationError('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [promptId, response, timeSpent, submitAttempt, onComplete, validateResponse]);

  /**
   * Auto-saves response periodically
   * Requirement: User Engagement - Progress preservation
   */
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (response.length > 0) {
        localStorage.setItem(`drill_response_${promptId}`, response);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(saveInterval);
  }, [promptId, response]);

  /**
   * Loads saved response on mount
   * Requirement: User Engagement - Session persistence
   */
  useEffect(() => {
    const savedResponse = localStorage.getItem(`drill_response_${promptId}`);
    if (savedResponse) {
      setResponse(savedResponse);
    }
  }, [promptId]);

  /**
   * Handles timer completion
   * Requirement: Case Prompt Drills - Timed exercise management
   */
  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" role="status">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent" />
        <span className="sr-only">Loading drill...</span>
      </div>
    );
  }

  if (error || !currentPrompt) {
    return (
      <div 
        className="p-4 border border-error-base rounded-md bg-error-base/10 text-error-base"
        role="alert"
      >
        {error || 'Failed to load drill prompt'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prompt section */}
      <section 
        className="prose prose-slate dark:prose-invert max-w-none"
        aria-label="Case prompt"
      >
        <h2 className="text-2xl font-bold">{currentPrompt.title}</h2>
        <p className="text-lg">{currentPrompt.description}</p>
      </section>

      {/* Timer section */}
      <section aria-label="Timer">
        <DrillTimer
          duration={currentPrompt.timeLimit * 60}
          drillId={promptId}
          onTimeUp={handleTimeUp}
          autoStart={true}
        />
      </section>

      {/* Response section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="response" 
            className="block text-sm font-medium mb-2"
          >
            Your Response
          </label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => {
              setResponse(e.target.value);
              validateResponse(e.target.value);
            }}
            className={cn(
              "w-full min-h-[300px] p-4 rounded-md border resize-y",
              "focus:ring-2 focus:ring-primary-base focus:outline-none",
              validationError ? "border-error-base" : "border-gray-300"
            )}
            placeholder="Enter your case analysis here..."
            aria-invalid={!!validationError}
            aria-describedby="response-error"
          />
          {validationError && (
            <p 
              id="response-error" 
              className="mt-2 text-sm text-error-base"
              role="alert"
            >
              {validationError}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {response.length}/{MAX_RESPONSE_LENGTH} characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!validationError}
          className={cn(
            "w-full py-3 px-4 rounded-md font-medium text-white",
            "transition-colors duration-200",
            isSubmitting || validationError
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary-base hover:bg-primary-hover"
          )}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </button>
      </form>

      {/* Feedback section */}
      {feedback && (
        <section 
          className="space-y-4 p-6 border rounded-md bg-gray-50"
          aria-label="Feedback"
        >
          <h3 className="text-xl font-semibold">Feedback</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-600">Strengths</h4>
              <ul className="list-disc list-inside">
                {feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-amber-600">Areas for Improvement</h4>
              <ul className="list-disc list-inside">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
            <p className="font-medium">
              Score: {feedback.score}/100
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default CasePromptDrill;