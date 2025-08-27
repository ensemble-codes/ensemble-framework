import { z } from 'zod';
import { 
  ethereumAddressRegex, 
  BigNumberishSchema, 
  JsonSchema,
  EthereumAddressSchema,
  UUIDSchema,
  URLSchema,
  OptionalDateTimeSchema 
} from './base.schemas';

// ============================================================================
// Service Schemas
// ============================================================================

/**
 * Schema for service categories
 * Defines the types of services available in the ecosystem
 */
export const ServiceCategorySchema = z.enum([
  'data',         // Data processing and analytics
  'research',     // Research and analysis
  'defi',         // DeFi services
  'social',       // Social media integration
  'security',     // Security services
  'vibes',        // Vibes services
  'other'         // Other services
]);

/**
 * Schema for service HTTP methods
 */
export const ServiceMethodSchema = z.enum([
  'HTTP_GET',
  'HTTP_POST', 
  'HTTP_PUT',
  'HTTP_DELETE'
]);

/**
 * Schema for service status (on-chain)
 * Represents the lifecycle state of the service
 */
export const ServiceStatusSchema = z.enum(['draft', 'published', 'archived', 'deleted']);

/**
 * Schema for service pricing models
 */
export const ServicePricingModelSchema = z.enum(['per_call', 'subscription', 'tiered', 'free']);

/**
 * Schema for service pricing
 */
export const ServicePricingSchema = z.object({
  model: ServicePricingModelSchema,
  price: BigNumberishSchema.optional(), // Optional for free services
  tokenAddress: z.string().regex(ethereumAddressRegex).optional(),
  freeQuota: z.number().int().min(0).optional() // Free calls before charging
});

/**
 * Schema for operational status (stored off-chain)
 */
export const ServiceOperationalStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy', 'maintenance']);

/**
 * Schema for on-chain service data
 * Minimal data stored on blockchain for gas efficiency
 */
export const ServiceOnChainSchema = z.object({
  id: z.string().describe('Auto-incremented service ID from blockchain'),
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  owner: EthereumAddressSchema,
  agentAddress: z.string().regex(ethereumAddressRegex, 'Invalid agent address format').optional(),
  serviceUri: z.string().describe('IPFS URI for service metadata'),
  status: ServiceStatusSchema,
  version: z.number().int().min(0).describe('Version for cache invalidation')
});

/**
 * Schema for off-chain service metadata (stored in IPFS)
 */
export const ServiceMetadataSchema = z.object({
  // Descriptive information
  description: z.string().min(1, 'Service description is required').max(500, 'Service description too long'),
  category: ServiceCategorySchema,
  
  // Technical specification
  endpointSchema: URLSchema,
  method: ServiceMethodSchema,
  parametersSchema: z.record(z.string(), JsonSchema).describe('Input parameters JSON schema'),
  resultSchema: z.record(z.string(), JsonSchema).describe('Expected output JSON schema'),
  
  // Service characteristics
  tags: z.array(z.string().min(1).max(50)).max(20).optional().describe('Service tags for discovery and categorization'),
  
  // Business and operational
  pricing: ServicePricingSchema.optional().describe('Service pricing configuration'),
  
  // Timestamps (stored off-chain for gas efficiency)
  createdAt: OptionalDateTimeSchema.describe('Service creation timestamp'),
  updatedAt: OptionalDateTimeSchema.describe('Service last update timestamp'),
  
  // Operational status (updated by monitoring)
  operational: z.object({
    status: ServiceOperationalStatusSchema,
    health: z.number().min(0).max(100).optional().describe('Health percentage'),
    lastCheck: OptionalDateTimeSchema,
    uptime: z.number().optional().describe('Uptime percentage'),
    responseTime: z.number().optional().describe('Average response time in ms'),
    errorRate: z.number().optional().describe('Error rate percentage')
  }).optional()
}).refine(
  // Validate tag uniqueness
  (data) => {
    if (!data.tags) return true;
    const uniqueTags = new Set(data.tags);
    return uniqueTags.size === data.tags.length;
  },
  {
    message: 'Service tags must be unique',
    path: ['tags']
  }
);

/**
 * Complete service record combining on-chain and off-chain data
 * This is the primary interface that SDK users work with
 */
export const ServiceRecordSchema = ServiceOnChainSchema.merge(
  ServiceMetadataSchema.omit({ operational: true })
).extend({
  // Include operational status as optional at the top level
  operational: ServiceMetadataSchema.shape.operational.optional()
}).refine(
  // Services with 'published' status must have an agent assigned
  (data) => {
    if (data.status === 'published') {
      return data.agentAddress && data.agentAddress !== '0x0000000000000000000000000000000000000000';
    }
    return true;
  },
  {
    message: 'Published services must have an agent assigned',
    path: ['agentAddress']
  }
);

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use ServiceRecordSchema instead
 */
export const ServiceSchema = ServiceRecordSchema;

/**
 * Schema for registering a new service
 * Combines minimal on-chain fields with full metadata for IPFS
 */
export const RegisterServiceParamsSchema = z.object({
  // On-chain fields
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  agentAddress: z.string().regex(ethereumAddressRegex, 'Invalid agent address format').optional(),
  
  // Off-chain metadata (will be stored in IPFS)
  metadata: ServiceMetadataSchema.omit({ operational: true, createdAt: true, updatedAt: true })
}).partial({
  agentAddress: true  // Optional until service is published
});

/**
 * Schema for updating an existing service
 * Allows updating on-chain fields and/or metadata
 */
export const UpdateServiceParamsSchema = z.object({
  id: z.string().describe('Service ID to update'),
  
  // On-chain updates (optional)
  name: z.string().min(1).max(100).optional(),
  agentAddress: z.string().regex(ethereumAddressRegex).optional(),
  status: ServiceStatusSchema.optional(),
  
  // Off-chain metadata updates (optional)
  metadata: ServiceMetadataSchema.omit({ operational: true, createdAt: true, updatedAt: true }).partial().optional()
}).refine(
  (data) => {
    // At least one field must be provided for update
    return data.name || data.agentAddress || data.status || data.metadata;
  },
  {
    message: 'At least one field must be provided for update'
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type ServiceMethod = z.infer<typeof ServiceMethodSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type ServiceOperationalStatus = z.infer<typeof ServiceOperationalStatusSchema>;
export type ServicePricingModel = z.infer<typeof ServicePricingModelSchema>;
export type ServicePricing = z.infer<typeof ServicePricingSchema>;
export type ServiceOnChain = z.infer<typeof ServiceOnChainSchema>;
export type ServiceMetadata = z.infer<typeof ServiceMetadataSchema>;
export type ServiceRecord = z.infer<typeof ServiceRecordSchema>;
export type RegisterServiceParams = z.infer<typeof RegisterServiceParamsSchema>;
export type UpdateServiceParams = z.infer<typeof UpdateServiceParamsSchema>;

// Legacy type alias for backwards compatibility
export type Service = ServiceRecord;

// ============================================================================
// Service Validation Functions
// ============================================================================

/**
 * Validates service record data against the ServiceRecord schema
 * @param data - The data to validate
 * @returns Validation result with success flag and data/error
 */
export const validateServiceRecord = (data: unknown) => {
  return ServiceRecordSchema.safeParse(data);
};

/**
 * Legacy validation function for backwards compatibility
 * @deprecated Use validateServiceRecord instead
 */
export const validateService = validateServiceRecord;

/**
 * Validates service registration parameters
 * @param data - The registration parameters to validate
 * @returns Validation result
 */
export const validateRegisterServiceParams = (data: unknown) => {
  return RegisterServiceParamsSchema.safeParse(data);
};

/**
 * Validates service update parameters
 * @param data - The update parameters to validate
 * @returns Validation result
 */
export const validateUpdateServiceParams = (data: unknown) => {
  return UpdateServiceParamsSchema.safeParse(data);
};

/**
 * Validates service on-chain data
 * @param data - The on-chain data to validate
 * @returns Validation result
 */
export const validateServiceOnChain = (data: unknown) => {
  return ServiceOnChainSchema.safeParse(data);
};

/**
 * Validates service metadata
 * @param data - The metadata to validate
 * @returns Validation result
 */
export const validateServiceMetadata = (data: unknown) => {
  return ServiceMetadataSchema.safeParse(data);
};

// ============================================================================
// Service Parsing Functions
// ============================================================================

/**
 * Parses and validates service record data
 * @param data - The data to parse
 * @throws ZodError if validation fails
 */
export const parseServiceRecord = (data: unknown): ServiceRecord => {
  return ServiceRecordSchema.parse(data);
};

/**
 * Legacy parsing function for backwards compatibility
 * @deprecated Use parseServiceRecord instead
 */
export const parseService = parseServiceRecord;

/**
 * Parses and validates service registration parameters
 * @param data - The registration parameters to parse
 * @throws ZodError if validation fails with enhanced error messages
 */
export const parseRegisterServiceParams = (data: unknown): RegisterServiceParams => {
  try {
    return RegisterServiceParamsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new z.ZodError([
        ...error.issues.map(issue => ({
          ...issue,
          message: `Service registration: ${issue.message}`
        }))
      ]);
    }
    throw error;
  }
};

/**
 * Parses and validates service update parameters
 * @param data - The update parameters to parse
 * @throws ZodError if validation fails with enhanced error messages
 */
export const parseUpdateServiceParams = (data: unknown): UpdateServiceParams => {
  try {
    return UpdateServiceParamsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new z.ZodError([
        ...error.issues.map(issue => ({
          ...issue,
          message: `Service update: ${issue.message}`
        }))
      ]);
    }
    throw error;
  }
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ServiceRecord
 * @param data - Data to check
 * @returns True if data matches ServiceRecord schema
 */
export const isServiceRecord = (data: unknown): data is ServiceRecord => {
  return ServiceRecordSchema.safeParse(data).success;
};

/**
 * Legacy type guard for backwards compatibility
 * @deprecated Use isServiceRecord instead
 */
export const isService = isServiceRecord;

/**
 * Type guard for RegisterServiceParams
 * @param data - Data to check
 * @returns True if data matches RegisterServiceParams schema
 */
export const isRegisterServiceParams = (data: unknown): data is RegisterServiceParams => {
  return RegisterServiceParamsSchema.safeParse(data).success;
};

/**
 * Type guard for UpdateServiceParams
 * @param data - Data to check
 * @returns True if data matches UpdateServiceParams schema
 */
export const isUpdateServiceParams = (data: unknown): data is UpdateServiceParams => {
  return UpdateServiceParamsSchema.safeParse(data).success;
};

/**
 * Type guard for ServiceOnChain
 * @param data - Data to check
 * @returns True if data matches ServiceOnChain schema
 */
export const isServiceOnChain = (data: unknown): data is ServiceOnChain => {
  return ServiceOnChainSchema.safeParse(data).success;
};

/**
 * Type guard for ServiceMetadata
 * @param data - Data to check
 * @returns True if data matches ServiceMetadata schema
 */
export const isServiceMetadata = (data: unknown): data is ServiceMetadata => {
  return ServiceMetadataSchema.safeParse(data).success;
};

/**
 * Helper function to format validation errors for user display
 * @param error - Zod validation error
 * @returns Formatted error message
 */
export const formatServiceValidationError = (error: z.ZodError): string => {
  const errorMessages = error.issues.map(issue => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
  
  return `Validation failed:\n${errorMessages.map(msg => `  - ${msg}`).join('\n')}`;
};