// Third-party imports
import React from 'react'; // ^18.0.0
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Radar 
} from 'recharts'; // ^2.0.0

// Internal imports
import { useProgress } from '../../hooks/useProgress';
import { UserProgress } from '../../types/user';
import { DrillType } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Verify color scheme matches design system
 * 2. Test responsiveness across different screen sizes
 * 3. Validate skill level calculation formulas with product team
 * 4. Set up monitoring for chart rendering performance
 */

// Props interface for SkillRadar component
interface SkillRadarProps {
  userId: string;
  className?: string;
}

// Map drill types to readable display names
const DRILL_TYPE_LABELS: Record<string, string> = {
  [DrillType.CASE_PROMPT]: 'Case Analysis',
  [DrillType.CALCULATION]: 'Calculations',
  [DrillType.CASE_MATH]: 'Case Math',
  [DrillType.BRAINSTORMING]: 'Brainstorming',
  [DrillType.MARKET_SIZING]: 'Market Sizing',
  [DrillType.SYNTHESIZING]: 'Synthesis'
};

/**
 * Transforms raw skill level data into format required by Recharts radar chart
 * Requirement: User Management - Progress tracking and performance analytics
 */
const formatSkillData = (skillLevels: Record<string, number>) => {
  return Object.entries(skillLevels).map(([skill, level]) => ({
    subject: DRILL_TYPE_LABELS[skill] || skill,
    score: Math.round(level * 100) // Convert to percentage
  }));
};

/**
 * Radar chart visualization of user's skill levels across different case interview competencies
 * 
 * Requirement: User Management - Progress tracking and performance analytics visualization
 * Requirement: System Performance - Visual representation of user performance metrics
 */
export const SkillRadar: React.FC<SkillRadarProps> = ({ userId, className = '' }) => {
  // Fetch user progress data using SWR
  const { progress, isLoading, error } = useProgress(userId);

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-base" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 text-error-base ${className}`}>
        <p>Failed to load skill data</p>
      </div>
    );
  }

  // Handle no data state
  if (!progress?.skillLevels) {
    return (
      <div className={`flex items-center justify-center h-64 text-primary-base ${className}`}>
        <p>No skill data available</p>
      </div>
    );
  }

  // Transform skill data for radar chart
  const chartData = formatSkillData(progress.skillLevels);

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          {/* Grid structure */}
          <PolarGrid 
            stroke="#E2E8F0" 
            strokeDasharray="3 3" 
          />

          {/* Skill labels */}
          <PolarAngleAxis 
            dataKey="subject"
            tick={{ 
              fill: '#1E293B',
              fontSize: 12,
              fontFamily: 'Inter'
            }}
          />

          {/* Score scale (0-100) */}
          <PolarRadiusAxis 
            angle={30}
            domain={[0, 100]}
            tick={{ 
              fill: '#64748B',
              fontSize: 10 
            }}
          />

          {/* Skill level visualization */}
          <Radar
            name="Skills"
            dataKey="score"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};