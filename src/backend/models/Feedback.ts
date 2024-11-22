// @package @supabase/supabase-js ^2.38.0
// @package zod ^3.22.0
// @package uuid ^9.0.0
// @package @types/uuid ^9.0.0

/**
 * Human Tasks:
 * 1. Configure Supabase database schema with appropriate tables and relations for feedback storage
 * 2. Set up proper indexing on feedback table for efficient querying by attempt ID
 * 3. Configure automated cleanup of old feedback data based on retention policy
 * 4. Review and adjust feedback metrics calculation formulas based on evaluation criteria
 */

import { z } from 'zod';
import { APIError, APIErrorCode } from '../types/api';
import { executeQuery, withTransaction } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

// Requirement: AI Evaluation - Structured feedback schema
const FeedbackMetricSchema = z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    comments: z.string()
});

const FeedbackContentSchema = z.object({
    summary: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    recommendations: z.array(z.string())
});

const FeedbackSchema = z.object({
    id: z.string().uuid(),
    attemptId: z.string().uuid(),
    type: z.enum(['DRILL', 'SIMULATION']),
    content: FeedbackContentSchema,
    score: z.number().min(0).max(100),
    metrics: z.array(FeedbackMetricSchema),
    createdAt: z.date(),
    updatedAt: z.date()
});

type FeedbackMetric = z.infer<typeof FeedbackMetricSchema>;
type FeedbackContent = z.infer<typeof FeedbackContentSchema>;
type FeedbackData = z.infer<typeof FeedbackSchema>;

// Requirement: AI Evaluation - Consistent feedback structure
export class Feedback {
    public id: string;
    public attemptId: string;
    public type: 'DRILL' | 'SIMULATION';
    public content: FeedbackContent;
    public score: number;
    public metrics: FeedbackMetric[];
    public createdAt: Date;
    public updatedAt: Date;

    constructor(feedbackData: Partial<FeedbackData>) {
        // Validate input data
        const validatedData = FeedbackSchema.parse({
            id: feedbackData.id || uuidv4(),
            attemptId: feedbackData.attemptId,
            type: feedbackData.type,
            content: feedbackData.content,
            score: feedbackData.score,
            metrics: feedbackData.metrics,
            createdAt: feedbackData.createdAt || new Date(),
            updatedAt: feedbackData.updatedAt || new Date()
        });

        this.id = validatedData.id;
        this.attemptId = validatedData.attemptId;
        this.type = validatedData.type;
        this.content = validatedData.content;
        this.score = validatedData.score;
        this.metrics = validatedData.metrics;
        this.createdAt = validatedData.createdAt;
        this.updatedAt = validatedData.updatedAt;
    }

    // Requirement: Performance Analytics - Feedback persistence
    public async save(): Promise<void> {
        try {
            await executeQuery(
                'insert_feedback',
                [
                    this.id,
                    this.attemptId,
                    this.type,
                    this.content,
                    this.score,
                    this.metrics,
                    this.createdAt.toISOString(),
                    this.updatedAt.toISOString()
                ]
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error('Failed to save feedback: ' + message);
        }
    }

    // Requirement: Performance Analytics - Feedback updates
    public async update(updateData: Partial<FeedbackData>): Promise<void> {
        try {
            await withTransaction(async (client) => {
                const validatedUpdate = FeedbackSchema.partial().parse({
                    ...updateData,
                    updatedAt: new Date()
                });

                await executeQuery(
                    'update_feedback',
                    [
                        this.id,
                        validatedUpdate
                    ]
                );

                Object.assign(this, validatedUpdate);
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error('Failed to update feedback: ' + message);
        }
    }

    // Requirement: Performance Analytics - Feedback deletion
    public async delete(): Promise<void> {
        try {
            await withTransaction(async (client) => {
                await executeQuery(
                    'delete_feedback',
                    [this.id]
                );
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error('Failed to delete feedback: ' + message);
        }
    }

    // Requirement: Performance Analytics - Feedback retrieval
    public static async findById(id: string): Promise<Feedback | null> {
        try {
            const result = await executeQuery<FeedbackData>(
                'select_feedback_by_id',
                [id],
                { singleRow: true }
            );

            return result ? new Feedback(result) : null;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error('Failed to find feedback: ' + message);
        }
    }

    // Requirement: Performance Analytics - Attempt feedback retrieval
    public static async findByAttempt(attemptId: string): Promise<Feedback[]> {
        try {
            const results = await executeQuery<FeedbackData[]>(
                'select_feedback_by_attempt',
                [attemptId]
            );

            return results.map(data => new Feedback(data));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error('Failed to find feedback by attempt: ' + message);
        }
    }
}