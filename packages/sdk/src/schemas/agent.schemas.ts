import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Ethereum address validation regex
 */
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

/**
 * Schema for agent social media links
 */
export const AgentSocialsSchema = z.object({
  twitter: z.string(),
  telegram: z.string(),
  dexscreener: z.string(),
  github: z.string().optional(),
  website: z.string().optional()
});

/**
 * Schema for agent communication types
 */
export const AgentCommunicationTypeSchema = z.enum(['xmtp', 'eliza']);

// ============================================================================
// Communication Parameters Schemas
// ============================================================================

/**
 * Schema for Eliza communication parameters with backward compatibility
 */
export const ElizaParamsSchema = z.object({
  connectionUrl: z.string().url('Invalid connection URL').optional(),
  websocketUrl: z.string().url('Invalid websocket URL').optional(), // Deprecated, for backward compatibility
  agentId: z.string().min(1, 'Agent ID is required'),
  version: z.enum(['0.x', '1.x']),
  env: z.enum(['production', 'dev'])
}).transform((data) => {
  // Handle backward compatibility: migrate websocketUrl to connectionUrl
  if (data.websocketUrl && !data.connectionUrl) {
    const { websocketUrl, ...rest } = data;
    return { ...rest, connectionUrl: websocketUrl };
  }
  // Remove websocketUrl if connectionUrl exists
  if (data.connectionUrl && data.websocketUrl) {
    const { websocketUrl, ...rest } = data;
    return rest;
  }
  return data;
}).refine((data) => data.connectionUrl, {
  message: 'Either connectionUrl or websocketUrl (deprecated) is required'
});

/**
 * Schema for XMTP communication parameters
 */
export const XMTPParamsSchema = z.object({
  address: z.string().regex(ethereumAddressRegex, 'Invalid Ethereum address'),
  env: z.enum(['production', 'dev'])
});

/**
 * Union schema for all communication parameters
 * Supports discriminated union for better type narrowing
 */
export const CommunicationParamsSchema = z.union([
  ElizaParamsSchema,
  XMTPParamsSchema
]);

/**
 * Flexible schema that accepts both string (JSON) and typed params
 * For backward compatibility
 */
export const FlexibleCommunicationParamsSchema = z.union([
  z.string(), // JSON string for backward compatibility
  CommunicationParamsSchema
]);

// ============================================================================
// Agent Schemas
// ============================================================================

/**
 * Schema for BigNumberish type (ethers.js compatible)
 */
export const BigNumberishSchema = z.union([
  z.bigint(),
  z.string(),
  z.number()
]);

/**
 * Schema for agent status
 */
export const AgentStatusSchema = z.enum(['active', 'inactive', 'maintenance', 'suspended']);

/**
 * Complete agent record schema
 */
export const AgentRecordSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  address: z.string().regex(ethereumAddressRegex, 'Invalid agent address'),
  category: z.string().min(1, 'Category is required'),
  owner: z.string().regex(ethereumAddressRegex, 'Invalid owner address'),
  agentUri: z.string().refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('ipfs://'),
    'URI must be a valid HTTP(S) URL or IPFS URI'
  ),
  imageURI: z.string().refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('ipfs://'),
    'Image URI must be a valid HTTP(S) URL or IPFS URI'
  ),
  attributes: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  prompts: z.array(z.string()).default([]),
  socials: AgentSocialsSchema,
  communicationType: AgentCommunicationTypeSchema,
  communicationParams: FlexibleCommunicationParamsSchema.optional(),
  reputation: BigNumberishSchema,
  totalRatings: BigNumberishSchema,
  status: AgentStatusSchema.optional()
});

/**
 * Schema for agent metadata (IPFS storage)
 */
export const AgentMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageURI: z.string(),
  socials: AgentSocialsSchema,
  agentCategory: z.string(),
  communicationType: AgentCommunicationTypeSchema,
  attributes: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  prompts: z.array(z.string()).default([]),
  communicationParams: FlexibleCommunicationParamsSchema.optional()
});

/**
 * Schema for registering a new agent
 */
export const RegisterAgentParamsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  agentUri: z.string().refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('ipfs://'),
    'Agent URI must be a valid HTTP(S) URL or IPFS URI'
  ),
  imageURI: z.string().refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('ipfs://'),
    'Image URI must be a valid HTTP(S) URL or IPFS URI'
  ).optional(),
  attributes: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  prompts: z.array(z.string()).optional(),
  socials: AgentSocialsSchema.partial().optional(),
  communicationType: AgentCommunicationTypeSchema.optional(),
  communicationParams: FlexibleCommunicationParamsSchema.optional()
});

/**
 * Schema for updating agent record (all fields optional except immutable ones)
 */
export const UpdateableAgentRecordSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  imageURI: z.string().refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('ipfs://'),
    'Image URI must be a valid HTTP(S) URL or IPFS URI'
  ).optional(),
  attributes: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  prompts: z.array(z.string()).optional(),
  socials: AgentSocialsSchema.partial().optional(),
  communicationType: AgentCommunicationTypeSchema.optional(),
  communicationParams: FlexibleCommunicationParamsSchema.optional(),
  status: AgentStatusSchema.optional()
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type AgentSocials = z.infer<typeof AgentSocialsSchema>;
export type AgentCommunicationType = z.infer<typeof AgentCommunicationTypeSchema>;
export type ElizaParams = z.infer<typeof ElizaParamsSchema>;
export type XMTPParams = z.infer<typeof XMTPParamsSchema>;
export type CommunicationParams = z.infer<typeof CommunicationParamsSchema>;
export type AgentRecord = z.infer<typeof AgentRecordSchema>;
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type RegisterAgentParams = z.infer<typeof RegisterAgentParamsSchema>;
export type UpdateableAgentRecord = z.infer<typeof UpdateableAgentRecordSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates agent record data
 * @returns Success with parsed data or failure with errors
 */
export const validateAgentRecord = (data: unknown) => {
  return AgentRecordSchema.safeParse(data);
};

/**
 * Validates registration parameters
 * @returns Success with parsed data or failure with errors
 */
export const validateRegisterParams = (data: unknown) => {
  return RegisterAgentParamsSchema.safeParse(data);
};

/**
 * Validates update parameters
 * @returns Success with parsed data or failure with errors
 */
export const validateUpdateParams = (data: unknown) => {
  return UpdateableAgentRecordSchema.safeParse(data);
};

/**
 * Validates communication parameters
 * @returns Success with parsed data or failure with errors
 */
export const validateCommunicationParams = (data: unknown) => {
  return CommunicationParamsSchema.safeParse(data);
};

// ============================================================================
// Parse Functions (throw on error)
// ============================================================================

/**
 * Parses and validates agent record data
 * @throws ZodError if validation fails
 */
export const parseAgentRecord = (data: unknown): AgentRecord => {
  return AgentRecordSchema.parse(data);
};

/**
 * Parses and validates registration parameters
 * @throws ZodError if validation fails
 */
export const parseRegisterParams = (data: unknown): RegisterAgentParams => {
  return RegisterAgentParamsSchema.parse(data);
};

/**
 * Parses and validates update parameters
 * @throws ZodError if validation fails
 */
export const parseUpdateParams = (data: unknown): UpdateableAgentRecord => {
  return UpdateableAgentRecordSchema.parse(data);
};

// ============================================================================
// Type Guards (using Zod)
// ============================================================================

/**
 * Type guard for ElizaParams
 */
export const isElizaParams = (params: unknown): params is ElizaParams => {
  return ElizaParamsSchema.safeParse(params).success;
};

/**
 * Type guard for XMTPParams
 */
export const isXMTPParams = (params: unknown): params is XMTPParams => {
  return XMTPParamsSchema.safeParse(params).success;
};

/**
 * Type guard for CommunicationParams
 */
export const isCommunicationParams = (params: unknown): params is CommunicationParams => {
  return CommunicationParamsSchema.safeParse(params).success;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parses communication params from JSON string or returns typed params
 */
export const parseCommunicationParamsFromString = (params: string | CommunicationParams): CommunicationParams | string => {
  if (typeof params === 'string') {
    try {
      const parsed = JSON.parse(params);
      const result = CommunicationParamsSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      // If it doesn't match our schema, return as string (backward compatibility)
      return params;
    } catch {
      // If JSON parsing fails, return as string
      return params;
    }
  }
  return params;
};

// ============================================================================
// Service Schemas
// ============================================================================

/**
 * Schema for service categories
 */
export const ServiceCategorySchema = z.enum([
  'ai',
  'data', 
  'automation',
  'defi',
  'social',
  'analytics',
  'oracle',
  'storage',
  'compute',
  'messaging'
]);

/**
 * Schema for service methods
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
export const ServiceStatusSchema = z.enum(['active', 'inactive', 'deprecated']);

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
 * Schema for JSON/object values
 * Using z.record for flexible key-value pairs
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

/**
 * Complete service schema
 * Note: Secrets should NEVER be stored in the service definition.
 * Use environment variables or secure key management systems instead.
 */
export const ServiceSchema = z.object({
  id: z.string().uuid({ message: 'Service ID must be a valid UUID' }),
  name: z.string().min(1, 'Service name is required').max(100),
  category: ServiceCategorySchema,
  description: z.string().min(1, 'Service description is required').max(500),
  owner: z.string().regex(ethereumAddressRegex, 'Invalid owner address'),
  agentAddress: z.string().regex(ethereumAddressRegex, 'Invalid agent address'),
  endpointSchema: z.string().url({ message: 'Endpoint must be a valid URL' }),
  method: ServiceMethodSchema,
  parametersSchema: z.record(z.string(), JsonSchema).describe('Input parameters schema'),
  resultSchema: z.record(z.string(), JsonSchema).describe('Expected output schema'),
  status: ServiceStatusSchema,
  pricing: ServicePricingSchema.optional()
});

/**
 * Schema for creating a new service (some fields optional or auto-generated)
 */
export const CreateServiceSchema = ServiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  id: z.string().uuid({ message: 'Service ID must be a valid UUID' }).optional() // Allow client to provide ID or auto-generate
});

/**
 * Schema for updating a service (all fields optional except id)
 */
export const UpdateServiceSchema = ServiceSchema.partial().required({
  id: true
});

// ============================================================================
// Service Type Exports
// ============================================================================

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type ServiceMethod = z.infer<typeof ServiceMethodSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type ServicePricingModel = z.infer<typeof ServicePricingModelSchema>;
export type ServicePricing = z.infer<typeof ServicePricingSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type CreateService = z.infer<typeof CreateServiceSchema>;
export type UpdateService = z.infer<typeof UpdateServiceSchema>;

// ============================================================================
// Service Validation Functions
// ============================================================================

/**
 * Validates service data
 * @returns Success with parsed data or failure with errors
 */
export const validateService = (data: unknown) => {
  return ServiceSchema.safeParse(data);
};

/**
 * Validates service creation parameters
 * @returns Success with parsed data or failure with errors
 */
export const validateCreateService = (data: unknown) => {
  return CreateServiceSchema.safeParse(data);
};

/**
 * Validates service update parameters
 * @returns Success with parsed data or failure with errors
 */
export const validateUpdateService = (data: unknown) => {
  return UpdateServiceSchema.safeParse(data);
};

/**
 * Parses and validates service data
 * @throws ZodError if validation fails
 */
export const parseService = (data: unknown): Service => {
  return ServiceSchema.parse(data);
};

/**
 * Parses and validates service creation parameters
 * @throws ZodError if validation fails
 */
export const parseCreateService = (data: unknown): CreateService => {
  return CreateServiceSchema.parse(data);
};

/**
 * Type guard for Service
 */
export const isService = (data: unknown): data is Service => {
  return ServiceSchema.safeParse(data).success;
};