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
 * Schema for Eliza communication parameters
 */
export const ElizaParamsSchema = z.object({
  websocketUrl: z.string().url('Invalid websocket URL'),
  agentId: z.string().min(1, 'Agent ID is required'),
  version: z.enum(['0.x', '1.x']),
  env: z.enum(['production', 'dev'])
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
  totalRatings: BigNumberishSchema
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
 * Schema for agent status
 */
export const AgentStatusSchema = z.enum(['active', 'inactive', 'maintenance', 'suspended']);

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