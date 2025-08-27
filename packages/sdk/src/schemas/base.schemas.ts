import { z } from 'zod';

// ============================================================================
// Base Constants and Regex Patterns
// ============================================================================

/**
 * Ethereum address validation regex
 * Matches valid Ethereum addresses (0x followed by 40 hexadecimal characters)
 */
export const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

// ============================================================================
// Base Schema Types
// ============================================================================

/**
 * Schema for BigNumberish values (compatible with ethers.js)
 * Accepts: number, string, bigint
 */
export const BigNumberishSchema = z.union([
  z.bigint(),
  z.string(),
  z.number()
]);

/**
 * Schema for JSON/object values
 * Recursive schema for flexible key-value pairs and arrays
 */
export const JsonSchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.record(z.string(), JsonSchema),
    z.array(JsonSchema)
  ])
);

// ============================================================================
// Common Utility Schemas
// ============================================================================

/**
 * Schema for Ethereum addresses with validation
 */
export const EthereumAddressSchema = z.string().regex(
  ethereumAddressRegex, 
  'Invalid Ethereum address format'
);

/**
 * Schema for optional Ethereum addresses
 */
export const OptionalEthereumAddressSchema = EthereumAddressSchema.optional();

/**
 * Schema for UUID strings
 */
export const UUIDSchema = z.string().uuid({ 
  message: 'Must be a valid UUID' 
});

/**
 * Schema for optional UUID strings
 */
export const OptionalUUIDSchema = UUIDSchema.optional();

/**
 * Schema for URL strings
 */
export const URLSchema = z.string().url({ 
  message: 'Must be a valid URL' 
});

/**
 * Schema for optional URL strings
 */
export const OptionalURLSchema = URLSchema.optional();

/**
 * Schema for datetime strings
 */
export const DateTimeSchema = z.string().datetime({ 
  message: 'Invalid datetime format' 
});

/**
 * Schema for optional datetime strings
 */
export const OptionalDateTimeSchema = DateTimeSchema.optional();

// ============================================================================
// Type Exports
// ============================================================================

export type BigNumberish = z.infer<typeof BigNumberishSchema>;
export type JsonValue = z.infer<typeof JsonSchema>;
export type EthereumAddress = z.infer<typeof EthereumAddressSchema>;