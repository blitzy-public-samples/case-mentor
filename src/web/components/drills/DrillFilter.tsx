// React v18.0.0
import * as React from 'react';

// Internal imports
import { DrillType, DrillDifficulty } from '../../types/drills';
import { Select } from '../shared/Select';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios for filter labels and select components
 * 2. Test keyboard navigation flow between filter controls
 * 3. Validate screen reader announcements for filter changes
 * 4. Ensure touch targets meet minimum size on mobile devices
 */

// Requirement: Practice Drills - Props interface for filter controls
interface DrillFilterProps {
  selectedType: DrillType | null;
  selectedDifficulty: DrillDifficulty | null;
  selectedIndustry: string | null;
  onTypeChange: (type: DrillType | null) => void;
  onDifficultyChange: (difficulty: DrillDifficulty | null) => void;
  onIndustryChange: (industry: string | null) => void;
  industries: string[];
}

// Requirement: Practice Drills - Filter interface for accessing different types of drills
const DrillFilter: React.FC<DrillFilterProps> = ({
  selectedType,
  selectedDifficulty,
  selectedIndustry,
  onTypeChange,
  onDifficultyChange,
  onIndustryChange,
  industries
}) => {
  // Convert DrillType enum values to SelectOption format
  const typeOptions = React.useMemo(() => [
    { value: '', label: 'All Types' },
    { value: DrillType.CASE_PROMPT, label: 'Case Prompt' },
    { value: DrillType.CALCULATION, label: 'Calculation' },
    { value: DrillType.CASE_MATH, label: 'Case Math' },
    { value: DrillType.BRAINSTORMING, label: 'Brainstorming' },
    { value: DrillType.MARKET_SIZING, label: 'Market Sizing' },
    { value: DrillType.SYNTHESIZING, label: 'Synthesizing' }
  ], []);

  // Convert DrillDifficulty enum values to SelectOption format
  const difficultyOptions = React.useMemo(() => [
    { value: '', label: 'All Difficulties' },
    { value: DrillDifficulty.BEGINNER, label: 'Beginner' },
    { value: DrillDifficulty.INTERMEDIATE, label: 'Intermediate' },
    { value: DrillDifficulty.ADVANCED, label: 'Advanced' }
  ], []);

  // Convert industries array to SelectOption format
  const industryOptions = React.useMemo(() => [
    { value: '', label: 'All Industries' },
    ...industries.map(industry => ({
      value: industry,
      label: industry
    }))
  ], [industries]);

  // Requirement: User Interface Design - Handle filter value changes
  const handleTypeChange = React.useCallback((value: string) => {
    onTypeChange(value ? value as DrillType : null);
  }, [onTypeChange]);

  const handleDifficultyChange = React.useCallback((value: string) => {
    onDifficultyChange(value ? value as DrillDifficulty : null);
  }, [onDifficultyChange]);

  const handleIndustryChange = React.useCallback((value: string) => {
    onIndustryChange(value || null);
  }, [onIndustryChange]);

  // Requirement: User Interface Design - Filter component following design system specifications
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="flex-1">
        <Select
          value={selectedType || ''}
          options={typeOptions}
          onChange={handleTypeChange}
          placeholder="Select drill type"
        />
      </div>
      <div className="flex-1">
        <Select
          value={selectedDifficulty || ''}
          options={difficultyOptions}
          onChange={handleDifficultyChange}
          placeholder="Select difficulty"
        />
      </div>
      <div className="flex-1">
        <Select
          value={selectedIndustry || ''}
          options={industryOptions}
          onChange={handleIndustryChange}
          placeholder="Select industry"
        />
      </div>
    </div>
  );
};

export default DrillFilter;
export type { DrillFilterProps };