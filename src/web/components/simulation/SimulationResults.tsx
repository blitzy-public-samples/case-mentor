/**
 * Human Tasks:
 * 1. Verify animation performance on lower-end devices
 * 2. Test color contrast ratios with different color schemes
 * 3. Validate ARIA labels with screen readers
 * 4. Ensure motion animations respect user preferences
 */

// Third-party imports
import React from 'react'; // ^18.0.0
import { motion } from 'framer-motion'; // ^10.0.0

// Internal imports
import { SimulationResult } from '../../types/simulation';
import { useSimulation } from '../../hooks/useSimulation';
import Card from '../shared/Card';

// Interface for component props
interface SimulationResultsProps {
  result: SimulationResult | null;
  onReset: () => void;
}

/**
 * Formats a numeric score as a percentage with 1 decimal place
 * @param score - Raw score value between 0 and 1
 * @returns Formatted percentage string
 */
const formatScore = (score: number): string => {
  if (score === null || score === undefined) return '0.0%';
  return `${(score * 100).toFixed(1)}%`;
};

/**
 * Component that displays the results of a completed ecosystem simulation with animated transitions
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
const SimulationResults: React.FC<SimulationResultsProps> = ({ result, onReset }) => {
  // Animation variants for score display
  const scoreVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Animation variants for feedback items
  const feedbackVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  // Early return if no result
  if (!result) return null;

  return (
    <Card 
      className="max-w-2xl mx-auto"
      shadow="lg"
      hoverable={false}
      aria-label="Simulation Results"
    >
      {/* Overall Score Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scoreVariants}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold mb-2" aria-label="Overall Score">
          Overall Score
        </h2>
        <div 
          className="text-4xl font-bold text-primary-base"
          aria-label={`Score: ${formatScore(result.score)}`}
        >
          {formatScore(result.score)}
        </div>
      </motion.div>

      {/* Ecosystem Metrics Section */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Ecosystem Stability */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scoreVariants}
          className="text-center"
        >
          <h3 className="text-lg font-semibold mb-2" aria-label="Ecosystem Stability">
            Ecosystem Stability
          </h3>
          <div 
            className="text-2xl font-bold text-secondary-base"
            aria-label={`Stability: ${formatScore(result.ecosystemStability)}`}
          >
            {formatScore(result.ecosystemStability)}
          </div>
        </motion.div>

        {/* Species Balance */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scoreVariants}
          className="text-center"
        >
          <h3 className="text-lg font-semibold mb-2" aria-label="Species Balance">
            Species Balance
          </h3>
          <div 
            className="text-2xl font-bold text-accent-base"
            aria-label={`Balance: ${formatScore(result.speciesBalance)}`}
          >
            {formatScore(result.speciesBalance)}
          </div>
        </motion.div>
      </div>

      {/* Feedback Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" aria-label="Detailed Feedback">
          Detailed Feedback
        </h3>
        <ul className="space-y-3" role="list" aria-label="Feedback items">
          {result.feedback.map((item, index) => (
            <motion.li
              key={index}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={feedbackVariants}
              className="flex items-start"
            >
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-secondary-base text-white text-sm mr-3">
                {index + 1}
              </span>
              <span className="text-gray-700">{item}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Reset Button */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scoreVariants}
        className="text-center"
      >
        <button
          onClick={onReset}
          className="px-6 py-3 bg-primary-base text-white rounded-lg font-semibold
                     hover:bg-primary-hover active:bg-primary-active 
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2"
          aria-label="Start New Simulation"
        >
          Start New Simulation
        </button>
      </motion.div>

      {/* Completion Timestamp */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scoreVariants}
        className="text-center mt-4 text-sm text-gray-500"
      >
        Completed: {new Date(result.completedAt).toLocaleString()}
      </motion.div>
    </Card>
  );
};

export default SimulationResults;