/**
 * Human Tasks:
 * 1. Ensure secure key storage solution is configured in production environment
 * 2. Review and adjust PBKDF2 iterations based on production hardware capabilities
 * 3. Set up key rotation policy and procedures for production deployment
 * 4. Configure proper secure random number generator entropy source in production
 * 5. Implement monitoring for cryptographic operation failures
 */

// @package node:crypto (Node.js built-in)
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';

// Requirement: Data Security (8.2) - Cryptographic constants
const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'base64';
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 32 bytes for AES-256
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

/**
 * Requirement: Data Security (8.2) - AES-256-GCM encryption with authentication
 * Encrypts sensitive data using AES-256-GCM with a random initialization vector
 */
export function encrypt(data: string, key: string): { ciphertext: string; iv: string; tag: string } {
  try {
    // Generate random IV
    const iv = randomBytes(IV_LENGTH);
    
    // Create cipher with key and IV
    const cipher = createCipheriv(ALGORITHM, Buffer.from(key, ENCODING), iv);
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted,
      iv: iv.toString(ENCODING),
      tag: tag.toString(ENCODING)
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Requirement: Data Security (8.2) - Authenticated decryption of AES-256-GCM encrypted data
 * Decrypts data that was encrypted using the encrypt function
 */
export function decrypt(
  encryptedData: { ciphertext: string; iv: string; tag: string },
  key: string
): string {
  try {
    // Create decipher
    const decipher = createDecipheriv(
      ALGORITHM,
      Buffer.from(key, ENCODING),
      Buffer.from(encryptedData.iv, ENCODING)
    );
    
    // Set auth tag for verification
    decipher.setAuthTag(Buffer.from(encryptedData.tag, ENCODING));
    
    // Decrypt data
    let decrypted = decipher.update(encryptedData.ciphertext, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Requirement: Security Architecture (5.4) - Secure password hashing using PBKDF2
 * Creates a secure hash of a password using PBKDF2 with 100000 iterations
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  try {
    // Generate random salt
    const salt = randomBytes(SALT_LENGTH);
    
    // Generate hash using PBKDF2
    const hash = pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST
    );
    
    return {
      hash: hash.toString(ENCODING),
      salt: salt.toString(ENCODING)
    };
  } catch (error) {
    throw new Error('Password hashing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Requirement: Security Architecture (5.4) - Secure password verification
 * Verifies a password against its stored hash using timing-safe comparison
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    // Generate hash with same parameters
    const hashToVerify = pbkdf2Sync(
      password,
      Buffer.from(salt, ENCODING),
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST
    );
    
    // Timing-safe comparison of hashes
    return timingSafeEqual(
      hashToVerify,
      Buffer.from(hash, ENCODING)
    );
  } catch (error) {
    throw new Error('Password verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Requirement: Data Security (8.2) - Secure key generation
 * Generates a cryptographically secure random key
 */
export function generateKey(length: number = KEY_LENGTH): string {
  try {
    const key = randomBytes(length);
    return key.toString(ENCODING);
  } catch (error) {
    throw new Error('Key generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}