// @package zod ^3.22.0
import { DrillType } from '../../types/drills';
import { DrillEvaluationCriteria } from '../drills/types';
import { openaiConfig } from '../../config/openai';

/**
 * Human Tasks:
 * 1. Review and adjust prompt templates based on actual evaluation quality metrics
 * 2. Monitor token usage to ensure prompts stay within OpenAI model limits
 * 3. Validate temperature settings effectiveness for each drill type
 * 4. Set up prompt version tracking for A/B testing different templates
 */

// Requirement: AI Evaluation - Core system prompt base
export const SYSTEM_PROMPT_BASE = 'You are an expert consulting case interview evaluator with extensive experience at top firms like McKinsey, Bain, and BCG.';

// Requirement: AI Evaluation - Token limit for prompts
export const MAX_PROMPT_LENGTH = 4096;

// Requirement: AI Evaluation - Temperature settings for different drill types
export const TEMPERATURE_BY_DRILL_TYPE: Record<DrillType, number> = {
    [DrillType.CASE_PROMPT]: 0.7,
    [DrillType.CALCULATION]: 0.3,
    [DrillType.CASE_MATH]: 0.3,
    [DrillType.BRAINSTORMING]: 0.8,
    [DrillType.MARKET_SIZING]: 0.5,
    [DrillType.SYNTHESIZING]: 0.7
};

// Requirement: Practice Drills - Pre-defined prompt templates for each drill type
export const DRILL_PROMPTS = {
    [DrillType.CASE_PROMPT]: `
        ${SYSTEM_PROMPT_BASE}
        
        Evaluate the candidate's case prompt response considering:
        1. Structure and framework clarity
        2. Initial hypothesis formation
        3. Key question identification
        4. Problem-solving approach
        5. Communication clarity
        
        Provide specific examples from their response to support your evaluation.
    `,
    
    [DrillType.CALCULATION]: `
        ${SYSTEM_PROMPT_BASE}
        
        Evaluate the candidate's calculation approach considering:
        1. Mathematical accuracy
        2. Logical step sequencing
        3. Assumption clarity
        4. Error checking
        5. Time efficiency
        
        Highlight any calculation errors and suggest improvements.
    `,
    
    [DrillType.CASE_MATH]: `
        ${SYSTEM_PROMPT_BASE}
        
        Evaluate the candidate's case math skills considering:
        1. Formula selection
        2. Variable identification
        3. Calculation execution
        4. Business context integration
        5. Result interpretation
        
        Identify any shortcuts or best practices they could have used.
    `,
    
    [DrillType.BRAINSTORMING]: `
        ${SYSTEM_PROMPT_BASE}
        
        Evaluate the candidate's brainstorming approach considering:
        1. MECE framework application
        2. Creativity and innovation
        3. Practical feasibility
        4. Comprehensive coverage
        5. Prioritization logic
        
        Assess both quantity and quality of ideas generated.
    `,
    
    [DrillType.MARKET_SIZING]: `
        ${SYSTEM_PROMPT_BASE}
        
        Evaluate the candidate's market sizing approach considering:
        1. Segmentation logic
        2. Assumption quality
        3. Calculation methodology
        4. Sanity checks
        5. Final recommendation
        
        Review their top-down and bottom-up approaches if present.
    `,
    
    [DrillType.SYNTHESIZING]: `
        ${SYSTEM_PROMPT_BASE}
        
        Evaluate the candidate's synthesis skills considering:
        1. Key insight identification
        2. Data integration
        3. Pattern recognition
        4. Conclusion formation
        5. Recommendation support
        
        Assess how well they connected different pieces of information.
    `
};

/**
 * Requirement: AI Evaluation - Generates customized evaluation prompt for specific drill type
 * @param drillType The type of drill being evaluated
 * @param criteria Specific evaluation criteria for the drill
 * @returns Complete evaluation prompt for OpenAI
 */
export const generateDrillPrompt = (
    drillType: DrillType,
    criteria: DrillEvaluationCriteria
): string => {
    // Validate drill type exists in templates
    if (!DRILL_PROMPTS[drillType]) {
        throw new Error(`Invalid drill type: ${drillType}`);
    }

    // Build custom prompt with base template and specific criteria
    const basePrompt = DRILL_PROMPTS[drillType];
    const rubricPrompt = `
        Evaluation Criteria:
        ${criteria.rubric.criteria.join('\n')}
        
        Scoring Guide:
        ${Object.entries(criteria.rubric.scoringGuide)
            .map(([criterion, guide]) => `${criterion}: ${guide}`)
            .join('\n')}
        
        Scoring Weights:
        ${Object.entries(criteria.weights)
            .map(([criterion, weight]) => `${criterion}: ${weight * 100}%`)
            .join('\n')}
        
        Maximum Score: ${criteria.rubric.maxScore}
    `;

    const fullPrompt = `
        ${basePrompt}
        
        ${rubricPrompt}
        
        Please provide a detailed evaluation following these criteria and weights.
        Include specific examples and actionable improvement suggestions.
    `.trim();

    // Validate prompt length
    if (fullPrompt.length > MAX_PROMPT_LENGTH) {
        throw new Error('Generated prompt exceeds maximum length');
    }

    return fullPrompt;
};

/**
 * Requirement: AI Evaluation - Generates feedback prompt based on evaluation results
 * @param evaluation The drill evaluation results
 * @returns Feedback generation prompt for OpenAI
 */
export const generateFeedbackPrompt = (evaluation: any): string => {
    const feedbackPrompt = `
        ${SYSTEM_PROMPT_BASE}
        
        Based on the following evaluation results:
        Score: ${evaluation.score}/100
        
        Strengths:
        ${evaluation.strengths.map((s: string) => `- ${s}`).join('\n')}
        
        Areas for Improvement:
        ${evaluation.improvements.map((i: string) => `- ${i}`).join('\n')}
        
        Please generate detailed, actionable feedback that:
        1. Acknowledges specific strengths with examples
        2. Provides concrete improvement suggestions
        3. Prioritizes feedback based on impact
        4. Includes specific practice recommendations
        5. Maintains an encouraging, constructive tone
        
        Format the feedback in clear sections with bullet points for easy reading.
    `.trim();

    // Validate prompt length
    if (feedbackPrompt.length > MAX_PROMPT_LENGTH) {
        throw new Error('Generated feedback prompt exceeds maximum length');
    }

    return feedbackPrompt;
};