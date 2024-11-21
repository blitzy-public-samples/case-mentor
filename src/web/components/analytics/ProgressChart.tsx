/**
 * Human Tasks:
 * 1. Verify chart color scheme with design team for accessibility
 * 2. Test chart responsiveness across different screen sizes
 * 3. Validate performance metrics calculation with product team
 * 4. Set up monitoring for chart rendering performance
 */

// Third-party imports
import React, { useMemo } from 'react'; // ^18.0.0
import {
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart
} from 'recharts'; // ^2.0.0

// Internal imports
import { useProgress } from '../../hooks/useProgress';
import { UserProgress } from '../../types/user';
import { formatScore, formatDate } from '../../lib/utils';

interface ProgressChartProps {
  userId: string;
  height: string;
  className?: string;
}

/**
 * A React component that renders an interactive chart displaying user's progress metrics.
 * 
 * Requirement: User Management - Progress tracking and performance analytics
 * Requirement: System Performance - Track and maintain >80% completion rate
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({
  userId,
  height,
  className = ''
}) => {
  // Fetch progress data using the useProgress hook
  const { progress, isLoading, error } = useProgress(userId);

  // Memoize the formatted chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!progress) return [];

    return [{
      date: progress.lastUpdated,
      drillsRate: progress.drillsSuccessRate,
      simulationsRate: progress.simulationsSuccessRate,
      drillsCompleted: progress.drillsCompleted,
      simulationsCompleted: progress.simulationsCompleted
    }];
  }, [progress]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-base" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`flex items-center justify-center text-error-base ${className}`} style={{ height }}>
        <p>Failed to load progress data: {error.message}</p>
      </div>
    );
  }

  // Show empty state
  if (!progress) {
    return (
      <div className={`flex items-center justify-center text-gray-500 ${className}`} style={{ height }}>
        <p>No progress data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          {/* Add grid for better readability */}
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

          {/* Configure X-axis with formatted dates */}
          <XAxis
            dataKey="date"
            tickFormatter={(date) => formatDate(date, 'MMM d, yyyy')}
            label={{ value: 'Date', position: 'bottom' }}
          />

          {/* Configure Y-axis with percentage values */}
          <YAxis
            tickFormatter={(value) => formatScore(value)}
            domain={[0, 1]}
            label={{ value: 'Success Rate', angle: -90, position: 'left' }}
          />

          {/* Add interactive tooltip */}
          <Tooltip
            formatter={(value: number, name: string) => {
              switch (name) {
                case 'drillsRate':
                  return [formatScore(value), 'Drills Success Rate'];
                case 'simulationsRate':
                  return [formatScore(value), 'Simulations Success Rate'];
                case 'drillsCompleted':
                  return [value, 'Drills Completed'];
                case 'simulationsCompleted':
                  return [value, 'Simulations Completed'];
                default:
                  return [value, name];
              }
            }}
            labelFormatter={(date) => formatDate(date as Date, 'MMM d, yyyy')}
          />

          {/* Add legend for different metrics */}
          <Legend />

          {/* Add lines for different metrics */}
          <Line
            type="monotone"
            dataKey="drillsRate"
            name="Drills Success Rate"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="simulationsRate"
            name="Simulations Success Rate"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};