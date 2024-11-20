'use client';

// Third-party imports
import { useParams, useRouter } from 'next/navigation'; // ^13.0.0
import { useState, useEffect } from 'react'; // ^18.0.0
import { useQuery } from '@tanstack/react-query'; // ^4.0.0

// Internal imports
import DrillTimer from '../../../../components/drills/DrillTimer';
import DrillCard from '../../../../components/drills/DrillCard';
import BrainstormingDrill from '../../../../components/drills/BrainstormingDrill';
import { useDrill } from '../../../../hooks/useDrill';
import { DrillType, DrillPrompt, DrillAttempt } from '../../../../types/drills';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated accessibility testing tools
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate drill submission behavior under different network conditions
 * 4. Monitor API response times to ensure <200ms target
 * 5. Test drill timer behavior across different subscription tiers
 */

// Map drill types to their respective components
const DRILL_TYPE_COMPONENTS: Record<DrillType, React.ComponentType<any>> = {
  [DrillType.BRAINSTORMING]: BrainstormingDrill,
  // Other drill type components will be implemented separately
  [DrillType.CASE_PROMPT]: () => null,
  [DrillType.CALCULATION]: () => null,
  [DrillType.CASE_MATH]: () => null,
  [DrillType.MARKET_SIZING]: () => null,
  [DrillType.SYNTHESIZING]: () => null,
};

// Constants for drill session management
const MIN_ATTEMPT_DURATION = 30; // seconds
const MAX_ATTEMPT_DURATION = 1800; // seconds

/**
 * Individual drill practice page component
 * Requirement: Practice Drills - Implements interactive interfaces for various drill types
 */
const DrillPage = () => {
  // Get drill ID from route parameters
  const params = useParams();
  const router = useRouter();
  const drillId = params.id as string;

  // Initialize drill session state
  const [isStarted, setIsStarted] = useState(false);
  const [currentDrill, setCurrentDrill] = useState<DrillPrompt | null>(null);

  // Fetch drill data with caching
  // Requirement: System Performance - Ensures <200ms API response time
  const { drills, submitAttempt, progress } = useDrill(DrillType.BRAINSTORMING);
  const { data: drill } = useQuery(
    ['drill', drillId],
    () => drills.find(d => d.id === drillId),
    {
      enabled: !!drillId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Update current drill when data is fetched
  useEffect(() => {
    if (drill) {
      setCurrentDrill(drill);
    }
  }, [drill]);

  /**
   * Handles starting a drill practice session
   * Requirement: Practice Drills - Manages drill session state
   */
  const handleStart = (drill: DrillPrompt) => {
    setIsStarted(true);
    setCurrentDrill(drill);
  };

  /**
   * Handles drill attempt completion
   * Requirement: User Management - Tracks user progress and performance
   */
  const handleDrillComplete = async (attempt: DrillAttempt) => {
    try {
      // Submit attempt with validation
      const result = await submitAttempt(
        attempt.promptId,
        attempt.response,
        attempt.timeSpent
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit attempt');
      }

      // Navigate to feedback view
      router.push(`/drills/${drillId}/feedback?attemptId=${result.data.id}`);
    } catch (error) {
      console.error('Error submitting drill attempt:', error);
      // Handle error state (implementation depends on UI requirements)
    }
  };

  /**
   * Returns the appropriate drill component based on type
   * Requirement: Practice Drills - Type-specific drill interfaces
   */
  const getDrillComponent = (type: DrillType) => {
    const DrillComponent = DRILL_TYPE_COMPONENTS[type];

    if (!DrillComponent) {
      return (
        <div 
          role="alert" 
          className="p-4 bg-error-base text-white rounded-md"
          aria-live="polite"
        >
          Unsupported drill type
        </div>
      );
    }

    return (
      <DrillComponent
        prompt={currentDrill!}
        onComplete={handleDrillComplete}
        aria-label={`${type} drill practice interface`}
      />
    );
  };

  // Handle loading state
  if (!currentDrill) {
    return (
      <div 
        role="status" 
        className="flex items-center justify-center h-96"
        aria-label="Loading drill content"
      >
        <div className="animate-spin h-8 w-8 border-4 border-primary-base border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main 
      className="container mx-auto px-4 py-8 max-w-4xl"
      aria-labelledby="drill-title"
    >
      {/* Requirement: Accessibility - WCAG 2.1 AA compliant interface */}
      <h1 
        id="drill-title" 
        className="text-2xl font-bold mb-6 text-gray-900"
      >
        {currentDrill.title}
      </h1>

      {!isStarted ? (
        // Drill card with start button
        <DrillCard
          drill={currentDrill}
          progress={progress}
          onStart={handleStart}
          className="w-full"
        />
      ) : (
        // Active drill interface
        <div className="space-y-6">
          {/* Timer component */}
          <DrillTimer
            duration={Math.min(
              Math.max(currentDrill.timeLimit * 60, MIN_ATTEMPT_DURATION),
              MAX_ATTEMPT_DURATION
            )}
            drillId={currentDrill.id}
            onTimeUp={() => handleDrillComplete({
              promptId: currentDrill.id,
              response: '',
              timeSpent: currentDrill.timeLimit * 60,
              id: '',
              userId: '',
              score: 0,
              feedback: {
                score: 0,
                comments: [],
                strengths: [],
                improvements: []
              },
              createdAt: new Date()
            })}
          />

          {/* Drill-specific interface */}
          {getDrillComponent(currentDrill.type)}
        </div>
      )}
    </main>
  );
};

export default DrillPage;