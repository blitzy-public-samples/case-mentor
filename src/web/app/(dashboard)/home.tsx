// Third-party imports
import React from 'react'; // ^18.0.0
import { format } from 'date-fns'; // ^2.30.0

// Internal imports
import { ProgressChart } from '../../components/analytics/ProgressChart';
import DrillCard from '../../components/drills/DrillCard';
import SimulationCard from '../../components/simulation/SimulationCard';
import PlanCard from '../../components/subscription/PlanCard';
import { SUBSCRIPTION_TIERS } from '../../config/constants';
import { DrillAttempt, DrillPrompt } from '../../types/drills';
import { UserSubscriptionTier } from '../../types/user';
import { SubscriptionPlan } from '../../types/subscription';

/**
 * Human Tasks:
 * 1. Verify accessibility compliance with WCAG 2.1 AA standards
 * 2. Test responsive layout across different screen sizes
 * 3. Validate performance metrics tracking implementation
 * 4. Set up monitoring for component render times
 */

/**
 * Main dashboard page component for authenticated users
 * Requirement: User Management - Profile customization, progress tracking, and performance analytics
 * Requirement: System Performance - Track and maintain >80% completion rate
 * Requirement: Core Features - Access to practice drills, McKinsey simulation, and subscription management
 */
export default async function Dashboard(): Promise<JSX.Element> {
  // Get authenticated user data from server
  const response = await fetch('/api/auth/session');
  const authState = await response.json();
  const userId = authState.user?.id;

  // Fetch drill data and progress from server
  const drillsResponse = await fetch('/api/drills');
  const { drills, progress } = await drillsResponse.json();
  const drillsLoading = false;
  const drillError = null;

  // Get simulation state from server
  const simulationResponse = await fetch('/api/simulation');
  const { simulationState } = await simulationResponse.json();
  const simulationLoading = false;
  const simulationError = null;

  // Format recent activity from drill attempts
  const getRecentActivity = (attempts: DrillAttempt[]): Array<{date: string, type: string, score: number}> => {
    return attempts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(attempt => ({
        date: format(new Date(attempt.createdAt), 'MMM d, yyyy'),
        type: attempt.promptId,
        score: attempt.score
      }));
  };

  return (
    <main className="container mx-auto px-4 py-8" role="main">
      {/* Welcome Section */}
      <section className="mb-8" aria-labelledby="welcome-heading">
        <h1 
          id="welcome-heading" 
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Welcome back, {authState.user?.profile.firstName}
        </h1>
        <p className="text-gray-600">
          Track your progress and continue your preparation journey.
        </p>
      </section>

      {/* Progress Overview */}
      <section className="mb-12" aria-labelledby="progress-heading">
        <h2 
          id="progress-heading" 
          className="text-xl font-semibold text-gray-900 mb-4"
        >
          Your Progress
        </h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ProgressChart 
            userId={userId}
            height="300px"
          />
        </div>
      </section>

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Practice Drills */}
        <section aria-labelledby="drills-heading">
          <h2 
            id="drills-heading" 
            className="text-xl font-semibold text-gray-900 mb-4"
          >
            Practice Drills
          </h2>
          <div className="space-y-4">
            {drillsLoading ? (
              <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
            ) : drillError ? (
              <p className="text-error-600">Failed to load drills: {drillError}</p>
            ) : drills?.length > 0 ? (
              drills.slice(0, 3).map((drill: DrillPrompt) => (
                <DrillCard
                  key={drill.id}
                  drill={drill}
                  progress={progress}
                  onStart={() => {/* Handle drill start */}}
                />
              ))
            ) : (
              <p className="text-gray-500">No practice drills available.</p>
            )}
          </div>
        </section>

        {/* Simulation Status */}
        <section aria-labelledby="simulation-heading">
          <h2 
            id="simulation-heading" 
            className="text-xl font-semibold text-gray-900 mb-4"
          >
            McKinsey Simulation
          </h2>
          {simulationState ? (
            <SimulationCard
              simulation={simulationState}
              loading={simulationLoading}
            />
          ) : simulationError ? (
            <p className="text-error-600">Failed to load simulation: {simulationError}</p>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">No active simulation.</p>
            </div>
          )}
        </section>
      </div>

      {/* Subscription Status */}
      <section className="mt-12" aria-labelledby="subscription-heading">
        <h2 
          id="subscription-heading" 
          className="text-xl font-semibold text-gray-900 mb-4"
        >
          Your Subscription
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(SUBSCRIPTION_TIERS).map(([tierName, plan]) => {
            const subscriptionPlan: SubscriptionPlan = {
              id: tierName,
              name: tierName,
              price: plan.price,
              features: [...plan.features],
              description: `Access to ${plan.drillAttempts} drill attempts`,
              tier: tierName as UserSubscriptionTier,
              interval: 'month',
              stripeProductId: '',
              stripePriceId: ''
            };
            return (
              <PlanCard
                key={tierName}
                plan={subscriptionPlan}
                isSelected={authState.user?.subscriptionTier === tierName}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}