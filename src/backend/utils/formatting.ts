// @package dayjs ^1.11.0
// @package numeral ^2.0.6

import dayjs from 'dayjs';
import numeral from 'numeral';
import { APIResponse, APIError } from '../types/api';
import { DrillResponse } from '../types/drills';

/**
 * Human Tasks:
 * 1. Ensure dayjs and numeral packages are installed with correct versions
 * 2. Configure timezone plugin for dayjs if needed for specific timezone handling
 * 3. Set up custom numeral.js formats if additional numerical formats are required
 * 4. Review and adjust precision settings based on business requirements
 */

/**
 * Formats a standardized API response
 * Requirement: API Design - Consistent API response formatting and error handling
 */
export function formatAPIResponse<T>(
    data: T,
    error: APIError | null = null,
    metadata: Record<string, any> = {}
): APIResponse<T> {
    const timestamp = formatTimestamp(new Date(), 'ISO');
    const requestId = crypto.randomUUID();

    return {
        success: !error,
        data,
        error: error ? {
            ...error,
            timestamp,
            requestId
        } : null,
        metadata: {
            ...metadata,
            timestamp,
            requestId,
            responseTime: Date.now() // For monitoring <200ms response time requirement
        }
    };
}

/**
 * Formats a drill-specific response
 * Requirement: API Design - Consistent API response formatting
 */
export function formatDrillResponse<T>(
    data: T,
    error: string | null = null
): DrillResponse<T> {
    return {
        success: !error,
        data,
        error
    };
}

/**
 * Formats timestamps consistently
 * Supported formats: 'ISO', 'YYYY-MM-DD', 'HH:mm:ss', 'relative'
 * Requirement: System Performance - Standardized formatting
 */
export function formatTimestamp(
    date: Date | string | number,
    format: string = 'ISO'
): string {
    try {
        const dayjsDate = dayjs(date);
        
        if (!dayjsDate.isValid()) {
            throw new Error('Invalid date provided');
        }

        switch (format) {
            case 'ISO':
                return dayjsDate.toISOString();
            case 'YYYY-MM-DD':
                return dayjsDate.format('YYYY-MM-DD');
            case 'HH:mm:ss':
                return dayjsDate.format('HH:mm:ss');
            case 'relative':
                return dayjsDate.fromNow();
            default:
                return dayjsDate.format(format);
        }
    } catch (error) {
        return 'Invalid Date';
    }
}

/**
 * Formats numerical scores with consistent precision
 * Requirement: System Performance - Standardized formatting
 */
export function formatScore(
    score: number,
    precision: number = 2
): string {
    if (score < 0 || score > 100) {
        throw new Error('Score must be between 0 and 100');
    }

    const format = `0.${'0'.repeat(precision)}`;
    return numeral(score).format(format) + '%';
}

/**
 * Formats time durations in human-readable format
 * Requirement: System Performance - Standardized formatting
 */
export function formatDuration(milliseconds: number): string {
    if (milliseconds < 0) {
        throw new Error('Duration cannot be negative');
    }

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }
    if (hours % 24 > 0) {
        parts.push(`${hours % 24} ${hours % 24 === 1 ? 'hour' : 'hours'}`);
    }
    if (minutes % 60 > 0) {
        parts.push(`${minutes % 60} ${minutes % 60 === 1 ? 'minute' : 'minutes'}`);
    }
    if (seconds % 60 > 0 && parts.length === 0) {
        parts.push(`${seconds % 60} ${seconds % 60 === 1 ? 'second' : 'seconds'}`);
    }

    return parts.length > 0 ? parts.join(', ') : '0 seconds';
}