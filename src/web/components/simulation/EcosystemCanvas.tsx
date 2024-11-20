// Third-party imports
import React, { useRef, useEffect, useCallback } from 'react'; // ^18.0.0
import classNames from 'classnames'; // ^2.3.2

// Internal imports
import { useSimulation } from '../../hooks/useSimulation';
import { 
  Species, 
  EnvironmentParameters, 
  SimulationStatus, 
  SpeciesType 
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Verify canvas performance on different devices and browsers
 * 2. Test animation frame rate under heavy load conditions
 * 3. Validate species visualization with UX team
 * 4. Configure proper canvas scaling for high-DPI displays
 * 5. Test environmental effect rendering with different parameter combinations
 */

// Canvas default dimensions
const CANVAS_DEFAULT_WIDTH = 800;
const CANVAS_DEFAULT_HEIGHT = 600;

// Species visualization colors
const SPECIES_COLORS = {
  PRODUCER: '#22C55E',
  CONSUMER: '#3B82F6'
};

// Animation frame rate for smooth rendering
const ANIMATION_FRAME_RATE = 60;
const FRAME_INTERVAL = 1000 / ANIMATION_FRAME_RATE;

// Interface for component props
interface EcosystemCanvasProps {
  className?: string;
  width?: number;
  height?: number;
}

// Interface for position tracking
interface Position {
  x: number;
  y: number;
}

/**
 * Custom hook for canvas setup and context management
 * Requirement: McKinsey Simulation - Ecosystem game replication
 */
const useCanvasSetup = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Configure context for high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    return ctx;
  }, [canvasRef]);

  useEffect(() => {
    const ctx = getContext();
    if (!ctx) return;

    // Set up initial canvas state
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current!;
    
    // Scale canvas for high-DPI displays
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
  }, [canvasRef, getContext]);

  return getContext;
};

/**
 * Renders individual species on the canvas
 * Requirement: Simulation Engine - Handles ecosystem game logic
 */
const drawSpecies = (
  ctx: CanvasRenderingContext2D,
  species: Species,
  position: Position
) => {
  const radius = species.type === SpeciesType.PRODUCER ? 8 : 12;
  const color = SPECIES_COLORS[species.type];

  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Add glow effect for active species
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Reset shadow effects
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

/**
 * Renders environmental effects on the canvas
 * Requirement: McKinsey Simulation - Complex data analysis
 */
const drawEnvironment = (
  ctx: CanvasRenderingContext2D,
  params: EnvironmentParameters
) => {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw depth gradient background
  const depthGradient = ctx.createLinearGradient(0, 0, 0, height);
  depthGradient.addColorStop(0, `rgba(0, 100, 255, ${params.depth / 200})`);
  depthGradient.addColorStop(1, `rgba(0, 50, 150, ${params.depth / 200})`);
  
  ctx.fillStyle = depthGradient;
  ctx.fillRect(0, 0, width, height);

  // Render temperature effect
  const tempOpacity = (params.temperature + 5) / 45; // Normalize -5 to 40 range
  ctx.fillStyle = `rgba(255, 100, 0, ${tempOpacity * 0.2})`;
  ctx.fillRect(0, 0, width, height);

  // Render light level
  const lightGradient = ctx.createRadialGradient(
    width / 2, 0, 0,
    width / 2, 0, height
  );
  lightGradient.addColorStop(0, `rgba(255, 255, 200, ${params.lightLevel / 100})`);
  lightGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = lightGradient;
  ctx.fillRect(0, 0, width, height);

  // Render salinity indicators
  const salinityParticles = Math.floor(params.salinity * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  
  for (let i = 0; i < salinityParticles; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
};

/**
 * Main canvas component for ecosystem visualization
 * Requirement: McKinsey Simulation - Ecosystem game replication
 */
export const EcosystemCanvas: React.FC<EcosystemCanvasProps> = ({
  className,
  width = CANVAS_DEFAULT_WIDTH,
  height = CANVAS_DEFAULT_HEIGHT
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  
  const { simulationState, status } = useSimulation();
  const getContext = useCanvasSetup(canvasRef);

  /**
   * Handles animation frame updates
   * Requirement: Simulation Engine - State management in frontend
   */
  const animate = useCallback((timestamp: number) => {
    const ctx = getContext();
    if (!ctx || !simulationState) return;

    // Control frame rate
    const elapsed = timestamp - lastFrameTimeRef.current;
    if (elapsed < FRAME_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTimeRef.current = timestamp;

    // Draw environment
    drawEnvironment(ctx, simulationState.environment);

    // Draw species
    simulationState.species.forEach((species, index) => {
      // Calculate position based on simulation state
      const position: Position = {
        x: (Math.sin(timestamp * 0.001 + index) + 1) * width * 0.4 + width * 0.1,
        y: (Math.cos(timestamp * 0.001 + index) + 1) * height * 0.4 + height * 0.1
      };
      drawSpecies(ctx, species, position);
    });

    // Continue animation if simulation is running
    if (status === SimulationStatus.RUNNING) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [getContext, simulationState, status, width, height]);

  // Set up animation loop
  useEffect(() => {
    if (status === SimulationStatus.RUNNING) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={classNames(
        'ecosystem-canvas',
        'border rounded-lg shadow-lg',
        className
      )}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};