// Third-party imports
import React from 'react'; // ^18.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0
import userEvent from '@testing-library/user-event'; // ^14.0.0

// Internal imports
import { ProgressChart } from '../../../../components/analytics/ProgressChart';
import { useProgress } from '../../../../hooks/useProgress';
import { UserProgress } from '../../../../types/user';

// Mock the useProgress hook
vi.mock('../../../../hooks/useProgress');

// Mock progress data for testing
const mockProgressData: UserProgress = {
  userId: 'test-user-id',
  drillsCompleted: 50,
  drillsSuccessRate: 0.85,
  simulationsCompleted: 25,
  simulationsSuccessRate: 0.75,
  skillLevels: {
    marketSizing: 0.80,
    calculation: 0.85,
    synthesis: 0.70
  },
  lastUpdated: new Date('2024-01-01T00:00:00Z')
};

describe('ProgressChart', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    (useProgress as jest.Mock).mockReset();
  });

  /**
   * Test case verifying loading state rendering
   * Requirement: User Management - Progress tracking and performance analytics
   */
  it('renders loading state', async () => {
    // Mock useProgress to return loading state
    (useProgress as jest.Mock).mockReturnValue({
      progress: null,
      isLoading: true,
      error: null
    });

    render(
      <ProgressChart 
        userId="test-user-id"
        height="400px"
        className="test-chart"
      />
    );

    // Verify loading spinner is present
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  /**
   * Test case verifying error state rendering
   * Requirement: System Performance - Track and maintain >80% completion rate
   */
  it('renders error state', async () => {
    const errorMessage = 'Failed to fetch progress data';
    
    // Mock useProgress to return error state
    (useProgress as jest.Mock).mockReturnValue({
      progress: null,
      isLoading: false,
      error: { message: errorMessage }
    });

    render(
      <ProgressChart 
        userId="test-user-id"
        height="400px"
        className="test-chart"
      />
    );

    // Verify error message is displayed
    expect(screen.getByText(`Failed to load progress data: ${errorMessage}`)).toBeInTheDocument();
  });

  /**
   * Test case verifying empty state rendering
   * Requirement: User Management - Progress tracking and performance analytics
   */
  it('renders empty state when no progress data', async () => {
    // Mock useProgress to return null progress
    (useProgress as jest.Mock).mockReturnValue({
      progress: null,
      isLoading: false,
      error: null
    });

    render(
      <ProgressChart 
        userId="test-user-id"
        height="400px"
        className="test-chart"
      />
    );

    // Verify empty state message is displayed
    expect(screen.getByText('No progress data available')).toBeInTheDocument();
  });

  /**
   * Test case verifying chart rendering with progress data
   * Requirement: System Performance - Track and maintain >80% completion rate
   */
  it('renders chart with progress data', async () => {
    // Mock useProgress to return test data
    (useProgress as jest.Mock).mockReturnValue({
      progress: mockProgressData,
      isLoading: false,
      error: null
    });

    render(
      <ProgressChart 
        userId="test-user-id"
        height="400px"
        className="test-chart"
      />
    );

    // Verify chart elements are present
    await waitFor(() => {
      // Check for chart legend items
      expect(screen.getByText('Drills Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Simulations Success Rate')).toBeInTheDocument();
      
      // Check for axis labels
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });
  });

  /**
   * Test case verifying tooltip interactions
   * Requirement: User Management - Progress tracking and performance analytics
   */
  it('handles tooltip interactions', async () => {
    // Mock useProgress to return test data
    (useProgress as jest.Mock).mockReturnValue({
      progress: mockProgressData,
      isLoading: false,
      error: null
    });

    render(
      <ProgressChart 
        userId="test-user-id"
        height="400px"
        className="test-chart"
      />
    );

    // Find and hover over data points
    const dataPoints = screen.getAllByRole('img');
    await userEvent.hover(dataPoints[0]);

    // Verify tooltip content
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument(); // Drills success rate
      expect(screen.getByText('75%')).toBeInTheDocument(); // Simulations success rate
    });
  });

  /**
   * Test case verifying proper hook usage
   * Requirement: User Management - Progress tracking and performance analytics
   */
  it('calls useProgress with correct userId', () => {
    const testUserId = 'test-user-id';
    
    // Mock useProgress with basic return value
    (useProgress as jest.Mock).mockReturnValue({
      progress: null,
      isLoading: true,
      error: null
    });

    render(
      <ProgressChart 
        userId={testUserId}
        height="400px"
        className="test-chart"
      />
    );

    // Verify useProgress was called with correct userId
    expect(useProgress).toHaveBeenCalledWith(testUserId);
  });
});