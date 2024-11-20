// Third-party imports
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0
import '@testing-library/jest-dom/matchers'; // ^6.1.0

// Internal imports
import EcosystemCanvas from '../../components/simulation/EcosystemCanvas';
import { SimulationState, SimulationStatus, Species, EnvironmentParameters, SpeciesType } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';

// Mock useSimulation hook
vi.mock('../../hooks/useSimulation', () => ({
  useSimulation: vi.fn()
}));

/**
 * Human Tasks:
 * 1. Verify canvas performance metrics in CI pipeline
 * 2. Test animation frame rates on different devices
 * 3. Validate species visualization with design team
 * 4. Test canvas scaling on high-DPI displays
 * 5. Verify environmental effects rendering
 */

// Helper function to create mock simulation state
const mockSimulationState = (overrides?: Partial<SimulationState>): SimulationState => ({
  id: 'test-simulation-id',
  userId: 'test-user-id',
  species: [],
  environment: {
    temperature: 25,
    depth: 100,
    salinity: 35,
    lightLevel: 80
  },
  timeRemaining: 3600,
  status: SimulationStatus.RUNNING,
  ...overrides
});

// Helper function to create mock species
const mockSpecies = (overrides?: Partial<Species>): Species => ({
  id: 'test-species-id',
  name: 'Test Species',
  type: SpeciesType.PRODUCER,
  energyRequirement: 50,
  reproductionRate: 0.5,
  ...overrides
});

describe('EcosystemCanvas', () => {
  // Mock canvas context
  const mockContext = {
    canvas: {
      width: 800,
      height: 600,
      clientWidth: 800,
      clientHeight: 600
    },
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    fillRect: vi.fn(),
    scale: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true
    });
  });

  // Requirement: McKinsey Simulation - Ecosystem game replication
  test('renders canvas element with correct dimensions', () => {
    const width = 800;
    const height = 600;
    
    render(
      <EcosystemCanvas
        width={width}
        height={height}
        className="test-canvas"
      />
    );

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', width.toString());
    expect(canvas).toHaveAttribute('height', height.toString());
    expect(canvas).toHaveClass('test-canvas');
  });

  // Requirement: Simulation Engine - Handles ecosystem game logic
  test('initializes canvas context correctly', () => {
    render(<EcosystemCanvas width={800} height={600} />);

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.scale).toHaveBeenCalledWith(1, 1);
  });

  // Requirement: McKinsey Simulation - Complex data analysis
  test('draws species based on simulation state', async () => {
    const mockState = mockSimulationState({
      species: [
        mockSpecies({ type: SpeciesType.PRODUCER }),
        mockSpecies({ type: SpeciesType.CONSUMER })
      ]
    });

    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    render(<EcosystemCanvas width={800} height={600} />);

    await waitFor(() => {
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });
  });

  // Requirement: Simulation Engine - State management in frontend
  test('updates canvas on environment changes', async () => {
    const mockState = mockSimulationState({
      environment: {
        temperature: 30,
        depth: 150,
        salinity: 40,
        lightLevel: 90
      }
    });

    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    render(<EcosystemCanvas width={800} height={600} />);

    await waitFor(() => {
      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockContext.createRadialGradient).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  // Requirement: McKinsey Simulation - Time-pressured scenarios
  test('handles animation frame updates', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(performance.now());
      return 1;
    });

    const mockState = mockSimulationState();
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    render(<EcosystemCanvas width={800} height={600} />);

    await waitFor(() => {
      expect(window.requestAnimationFrame).toHaveBeenCalled();
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
  });

  // Requirement: Simulation Engine - Handles ecosystem game logic
  test('cleans up resources on unmount', async () => {
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const mockState = mockSimulationState();
    (useSimulation as jest.Mock).mockReturnValue({
      simulationState: mockState,
      status: SimulationStatus.RUNNING
    });

    const { unmount } = render(<EcosystemCanvas width={800} height={600} />);
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  // Requirement: McKinsey Simulation - Complex data analysis
  test('handles high-DPI displays correctly', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2
    });

    render(<EcosystemCanvas width={800} height={600} />);

    expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
  });
});