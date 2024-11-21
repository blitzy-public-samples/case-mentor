// Third-party imports
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

// Internal imports
import supabase from './supabase';
import { APIError, ErrorCode } from '../types/api';

/**
 * Human Tasks:
 * 1. Verify Supabase storage bucket configuration in dashboard
 * 2. Set up proper CORS settings for file uploads
 * 3. Configure storage retention policies per subscription tier
 * 4. Monitor storage usage and implement cleanup for orphaned files
 * 5. Test file upload/download with various file sizes and types
 */

// Requirement: File Storage - Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Requirement: Security Controls - Allowed file types for upload validation
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'application/pdf'
];

/**
 * Validates file size and type against allowed configurations
 * Requirement: Security Controls - Input validation for file operations
 */
const validateFile = (file: File): boolean => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verify file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  return true;
};

/**
 * Uploads a file to Supabase storage with validation and error handling
 * Requirement: File Storage - Supabase Storage for user uploads
 */
const uploadFile = async (file: File, bucket: string): Promise<string> => {
  try {
    // Validate file before upload
    validateFile(file);

    // Generate unique file name using UUID
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    // Upload file to specified bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to upload file',
        details: error
      } as APIError;
    }

    // Return public URL of uploaded file
    return getPublicUrl(fileName, bucket);
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
        details: { fileName: file.name, fileType: file.type, fileSize: file.size }
      } as APIError;
    }
    throw error;
  }
};

/**
 * Deletes a file from Supabase storage
 * Requirement: File Storage - Secure file handling
 */
const deleteFile = async (path: string, bucket: string): Promise<void> => {
  try {
    // Validate path format
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid file path');
    }

    // Delete file from specified bucket
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to delete file',
        details: error
      } as APIError;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
        details: { filePath: path, bucket }
      } as APIError;
    }
    throw error;
  }
};

/**
 * Generates a public URL for accessing a stored file
 * Requirement: File Storage - Public URL generation for stored files
 */
const getPublicUrl = (path: string, bucket: string): string => {
  try {
    // Validate path format
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid file path');
    }

    // Generate public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
        details: { filePath: path, bucket }
      } as APIError;
    }
    throw error;
  }
};

// Export functions and constants for external use
export {
  uploadFile,
  deleteFile,
  getPublicUrl,
  ALLOWED_FILE_TYPES
};