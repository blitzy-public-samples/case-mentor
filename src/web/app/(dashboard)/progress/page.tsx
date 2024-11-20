/**
 * Human Tasks:
 * 1. Verify analytics visualization colors meet WCAG 2.1 AA contrast requirements
 * 2. Test responsive layout across different screen sizes and devices
 * 3. Validate progress metrics calculation with product team
 * 4. Set up monitoring for component render performance
 */

// Third-party imports
import React from 'react'; // ^18.0.0

// Internal imports
import { ProgressChart } from '../../../components/analytics/ProgressChart';
import { ScoreDistribution } from '../../../components/analytics/ScoreDistribution';
import { SkillRadar } from '../../../components/analytics/SkillRadar';
import { useProgress } from '../../../hooks/useProgress';
import { useAuth } from '../../../hooks/useAuth';
import { DrillType } from '../../../types/drills';

/**
 * Progress analytics dashboard page component displaying comprehensive user performance metrics
 * 
 * Requirement: User Management - Progress tracking and performance analytics for user practice activities
 * Requirement: System Performance - Track and maintain >80% completion rate through visual feedback
 */
export default async function ProgressPage() {
  // Get authenticated user context
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  // Fetch user progress data
  const { progress, isLoading, error } = useProgress(userId);

  // Handle loading state
  if (isLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 text-error-base">
        <p className="text-lg">Failed to load progress data: {error.message}</p>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary-base">
          Progress Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Track your performance and skill development across practice activities
        </p>
      </header>

      {/* Progress metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall progress chart section */}
        <section className="col-span-full">
          <h2 className="text-xl font-semibold mb-4 text-primary-base">
            Progress Overview
          </h2>
          <ProgressChart
            userId={userId}
            height="400px"
            className="w-full bg-white rounded-lg shadow-md"
          />
        </section>

        {/* Score distribution section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-primary-base">
            Performance Analysis
          </h2>
          <ScoreDistribution
            drillType={DrillType.CASE_PROMPT}
            className="h-[300px] bg-white rounded-lg shadow-md"
          />
        </section>

        {/* Skill radar section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-primary-base">
            Skill Assessment
          </h2>
          <SkillRadar
            userId={userId}
            className="h-[300px] bg-white rounded-lg shadow-md"
          />
        </section>
      </div>

      {/* Summary statistics */}
      {progress && (
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Drills Completed
            </h3>
            <p className="text-2xl font-bold text-primary-base mt-2">
              {progress.drillsCompleted}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Success Rate
            </h3>
            <p className="text-2xl font-bold text-accent-base mt-2">
              {Math.round(progress.drillsSuccessRate * 100)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Simulations Completed
            </h3>
            <p className="text-2xl font-bold text-primary-base mt-2">
              {progress.simulationsCompleted}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Simulation Success Rate
            </h3>
            <p className="text-2xl font-bold text-accent-base mt-2">
              {Math.round(progress.simulationsSuccessRate * 100)}%
            </p>
          </div>
        </section>
      )}
    </main>
  );
}