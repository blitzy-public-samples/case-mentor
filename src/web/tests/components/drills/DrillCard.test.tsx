// Third-party imports
import React from 'react'; // ^18.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

// Internal imports
import DrillCard from '../../../components/drills/DrillCard';
import { DrillType, DrillPrompt, DrillProgress, DrillDifficulty } from '../../../types/drills';

// Mock data for tests
const mockDrillPrompt: DrillPrompt = {
  id: 'test-drill-1',
  type: DrillType.CASE_PROMPT,
  difficulty: DrillDifficulty.INTERMEDIATE,
  title: 'Test Case Prompt',
  description: 'Test description',
  timeLimit: 15,
  industry: 'Technology',
  requiredTier: 'BASIC'
};

const mockDrillProgress: DrillProgress = {
  drillType: DrillType.CASE_PROMPT,
  attemptsCount: 5,
  averageScore: 85,
  bestScore: 95,
  lastAttemptDate: new Date('2023-01-01T00:00:00.000Z')
};

// Test suite for DrillCard component
describe('DrillCard', () => {
  // Requirement: Practice Drills - Validates correct display of drill information
  it('renders drill information correctly', () => {
    const onStart = vi.fn();
    render(
      <DrillCard
        drill={mockDrillPrompt}
        onStart={onStart}
      />
    );

    // Verify title is displayed
    expect(screen.getByText('Test Case Prompt')).toBeInTheDocument();

    // Verify drill type is shown
    expect(screen.getByText('CASE_PROMPT')).toBeInTheDocument();

    // Verify difficulty level
    expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
    expect(screen.getByText('INTERMEDIATE')).toHaveClass('bg-yellow-100', 'text-yellow-800');

    // Verify industry and time limit
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();

    // Verify subscription tier requirement
    expect(screen.getByText('BASIC subscription required')).toBeInTheDocument();
  });

  // Requirement: User Interface Design - Tests interaction with start practice button
  it('handles start practice button click', async () => {
    const onStart = vi.fn();
    render(
      <DrillCard
        drill={mockDrillPrompt}
        onStart={onStart}
      />
    );

    // Find and click start button
    const startButton = screen.getByText('Start Practice');
    fireEvent.click(startButton);

    // Verify handler was called with correct drill data
    await waitFor(() => {
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(mockDrillPrompt);
    });
  });

  // Requirement: Practice Drills - Verifies progress information display
  it('displays progress correctly when provided', () => {
    const onStart = vi.fn();
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={onStart}
      />
    );

    // Verify progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '85');

    // Verify attempts count
    expect(screen.getByText('5 attempts')).toBeInTheDocument();

    // Verify average score
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  // Requirement: Accessibility Requirements - Tests accessibility features
  it('meets accessibility requirements', () => {
    const onStart = vi.fn();
    render(
      <DrillCard
        drill={mockDrillPrompt}
        progress={mockDrillProgress}
        onStart={onStart}
      />
    );

    // Verify ARIA labels
    expect(screen.getByLabelText('Difficulty: INTERMEDIATE')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Drill progress');

    // Verify button accessibility
    const startButton = screen.getByText('Start Practice');
    expect(startButton).toHaveAttribute('aria-describedby', `drill-title-${mockDrillPrompt.id}`);

    // Verify icons have aria-hidden
    const icons = document.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  // Requirement: User Interface Design - Tests responsive layout
  it('applies correct styling classes', () => {
    const onStart = vi.fn();
    render(
      <DrillCard
        drill={mockDrillPrompt}
        className="custom-class"
        onStart={onStart}
      />
    );

    // Verify card wrapper has correct classes
    const card = screen.getByRole('article');
    expect(card).toHaveClass(
      'flex',
      'flex-col',
      'gap-4',
      'transition-all',
      'duration-200',
      'custom-class'
    );

    // Verify hover classes are applied
    expect(card).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
  });

  // Requirement: Practice Drills - Tests conditional rendering
  it('does not display progress when not provided', () => {
    const onStart = vi.fn();
    render(
      <DrillCard
        drill={mockDrillPrompt}
        onStart={onStart}
      />
    );

    // Verify progress section is not rendered
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('attempts')).not.toBeInTheDocument();
  });
});