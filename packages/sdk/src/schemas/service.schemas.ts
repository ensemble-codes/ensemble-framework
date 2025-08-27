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
 * Schema for service status
 */
export const ServiceStatusSchema = z.enum(['draft', 'active', 'inactive', 'archived', 'deleted']);

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
 * Complete service schema with all fields
 * Note: Secrets should NEVER be stored in the service definition.
 * Use environment variables or secure key management systems instead.
 */
export const ServiceSchema = z.object({
  // Core identity fields (required)
  id: UUIDSchema,
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  description: z.string().min(1, 'Service description is required').max(500, 'Service description too long'),
  category: ServiceCategorySchema,
  owner: EthereumAddressSchema,
  status: ServiceStatusSchema,
  
  // Agent assignment (optional but required for service to go live)
  agentAddress: z.string().regex(ethereumAddressRegex, 'Invalid agent address format').optional(),
  
  // Technical specification
  endpointSchema: URLSchema,
  method: ServiceMethodSchema,
  parametersSchema: z.record(z.string(), JsonSchema).describe('Input parameters JSON schema'),
  resultSchema: z.record(z.string(), JsonSchema).describe('Expected output JSON schema'),
  
  // Service characteristics
  tags: z.array(z.string().min(1).max(50)).max(20).optional().describe('Service tags for discovery and categorization'),
  
  // Business and operational
  pricing: ServicePricingSchema.optional().describe('Service pricing configuration'),
  
  // Timestamps
  createdAt: OptionalDateTimeSchema,
  updatedAt: OptionalDateTimeSchema
}).refine(
  // Services with 'active' status must have an agent assigned
  (data) => {
    if (data.status === 'active') {
      return data.agentAddress && data.agentAddress !== '0x0000000000000000000000000000000000000000';
    }
    return true;
  },
  {
    message: 'Active services must have an agent assigned',
    path: ['agentAddress']
  }
).refine(
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
 * Schema for creating a new service (omits generated fields)
 */
export const RegisterServiceParamsSchema = ServiceSchema.omit({
  createdAt: true,   // Generated
  updatedAt: true,   // Generated
}).partial({
  id: true,          // Optional - generated if not provided
  status: true,      // Defaults to 'draft'
});

/**
 * Schema for updating an existing service
 * All fields optional except ID
 */
export const UpdateServiceSchema = ServiceSchema.partial().required({
  id: true
});

// ============================================================================
// Type Exports
// ============================================================================

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type ServiceMethod = z.infer<typeof ServiceMethodSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type ServicePricingModel = z.infer<typeof ServicePricingModelSchema>;
export type ServicePricing = z.infer<typeof ServicePricingSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type RegisterServiceParams = z.infer<typeof RegisterServiceParamsSchema>;
export type UpdateService = z.infer<typeof UpdateServiceSchema>;

// ============================================================================
// Service Validation Functions
// ============================================================================

/**
 * Validates service data against the Service schema
 * @param data - The data to validate
 * @returns Validation result with success flag and data/error
 */
export const validateService = (data: unknown) => {
  return ServiceSchema.safeParse(data);
};

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
export const validateUpdateService = (data: unknown) => {
  return UpdateServiceSchema.safeParse(data);
};

// ============================================================================
// Service Parsing Functions
// ============================================================================

/**
 * Parses and validates service data
 * @param data - The data to parse
 * @throws ZodError if validation fails
 */
export const parseService = (data: unknown): Service => {
  return ServiceSchema.parse(data);
};

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
export const parseUpdateService = (data: unknown): UpdateService => {
  try {
    return UpdateServiceSchema.parse(data);
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
 * Type guard for Service
 * @param data - Data to check
 * @returns True if data matches Service schema
 */
export const isService = (data: unknown): data is Service => {
  return ServiceSchema.safeParse(data).success;
};

/**
 * Type guard for RegisterServiceParams
 * @param data - Data to check
 * @returns True if data matches RegisterServiceParams schema
 */
export const isRegisterServiceParams = (data: unknown): data is RegisterServiceParams => {
  return RegisterServiceParamsSchema.safeParse(data).success;
};

/**
 * Type guard for UpdateService
 * @param data - Data to check
 * @returns True if data matches UpdateService schema
 */
export const isUpdateService = (data: unknown): data is UpdateService => {
  return UpdateServiceSchema.safeParse(data).success;
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