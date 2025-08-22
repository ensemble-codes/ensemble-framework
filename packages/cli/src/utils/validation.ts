import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as yamlParse } from 'yaml';
import { AgentRecordYAML } from '../types/config';
import { validateRegisterParams, RegisterAgentParams } from '@ensemble-ai/sdk';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  checkUrls?: boolean;
  schemaOnly?: boolean;
}

export async function validateAgentRecordYAML(
  filepath: string, 
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    // Check if file exists
    if (!existsSync(filepath)) {
      result.errors.push(`File not found: ${filepath}`);
      result.valid = false;
      return result;
    }

    // Read and parse YAML
    const fileContent = await readFile(filepath, 'utf-8');
    let agentRecord: AgentRecordYAML;
    
    try {
      agentRecord = yamlParse(fileContent);
    } catch (parseError: any) {
      result.errors.push(`YAML parsing error: ${parseError.message}`);
      result.valid = false;
      return result;
    }

    // Convert YAML format to SDK format and validate using Zod
    const sdkFormat = convertYamlToSdkFormat(agentRecord);
    const sdkValidation = validateRegisterParams(sdkFormat);
    
    if (!sdkValidation.success) {
      sdkValidation.error.issues.forEach((issue: any) => {
        result.errors.push(`${issue.path.join('.')}: ${issue.message}`);
      });
    }

    if (!options.schemaOnly) {
      // Additional business rule validations
      validateBusinessRules(agentRecord, result);
      
      if (options.checkUrls) {
        await validateUrls(agentRecord, result);
      }
    }

  } catch (error: any) {
    result.errors.push(`Validation error: ${error.message}`);
    result.valid = false;
  }

  result.valid = result.errors.length === 0;
  return result;
}

function convertYamlToSdkFormat(agentRecord: AgentRecordYAML): RegisterAgentParams {
  return {
    name: agentRecord.name,
    description: agentRecord.description,
    category: agentRecord.category,
    agentUri: agentRecord.agentUri || 'https://example.com/default-agent-metadata.json',
    imageURI: agentRecord.imageURI,
    attributes: agentRecord.attributes,
    instructions: agentRecord.instructions,
    prompts: agentRecord.prompts,
    socials: agentRecord.socials ? {
      twitter: agentRecord.socials.twitter || '',
      telegram: agentRecord.socials.telegram || '',
      dexscreener: agentRecord.socials.dexscreener || '',
      github: agentRecord.socials.github,
      website: agentRecord.socials.website
    } : undefined,
    communicationType: agentRecord.communication?.type as any,
    communicationParams: agentRecord.communication?.params ? JSON.stringify(agentRecord.communication.params) : undefined
  };
}

function validateSchema(agentRecord: any, result: ValidationResult): void {
  // Required fields
  const requiredFields = ['name', 'description', 'category'];
  
  for (const field of requiredFields) {
    if (!agentRecord[field] || typeof agentRecord[field] !== 'string' || agentRecord[field].trim() === '') {
      result.errors.push(`Required field '${field}' is missing or empty`);
    }
  }

  // Validate types
  if (agentRecord.attributes && !Array.isArray(agentRecord.attributes)) {
    result.errors.push('Field \'attributes\' must be an array');
  }

  if (agentRecord.instructions && !Array.isArray(agentRecord.instructions)) {
    result.errors.push('Field \'instructions\' must be an array');
  }

  if (agentRecord.prompts && !Array.isArray(agentRecord.prompts)) {
    result.errors.push('Field \'prompts\' must be an array');
  }

  if (agentRecord.communication && typeof agentRecord.communication !== 'object') {
    result.errors.push('Field \'communication\' must be an object');
  }

  if (agentRecord.socials && typeof agentRecord.socials !== 'object') {
    result.errors.push('Field \'socials\' must be an object');
  }

  // Validate communication type
  if (agentRecord.communication?.type) {
    const validCommTypes = ['socketio-eliza', 'xmtp'];
    if (!validCommTypes.includes(agentRecord.communication.type)) {
      result.errors.push(`Invalid communication type. Must be one of: ${validCommTypes.join(', ')}`);
    }
  }

  // Validate status
  if (agentRecord.status) {
    const validStatuses = ['active', 'inactive', 'maintenance', 'suspended'];
    if (!validStatuses.includes(agentRecord.status)) {
      result.errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
}

function validateBusinessRules(agentRecord: AgentRecordYAML, result: ValidationResult): void {
  // Name length validation
  if (agentRecord.name && agentRecord.name.length > 100) {
    result.warnings.push('Agent name is longer than 100 characters');
  }

  // Description length validation
  if (agentRecord.description && agentRecord.description.length > 1000) {
    result.warnings.push('Agent description is longer than 1000 characters');
  }

  // Category validation
  const validCategories = [
    'ai-assistant', 'chatbot', 'service', 'data-analysis', 
    'trading', 'content-creation', 'automation', 'general'
  ];
  
  if (agentRecord.category && !validCategories.includes(agentRecord.category)) {
    result.warnings.push(`Uncommon category '${agentRecord.category}'. Consider using: ${validCategories.join(', ')}`);
  }

  // Attributes validation
  if (agentRecord.attributes && agentRecord.attributes.length > 20) {
    result.warnings.push('Too many attributes (>20). Consider consolidating.');
  }

  // Instructions validation
  if (agentRecord.instructions && agentRecord.instructions.length > 10) {
    result.warnings.push('Too many instructions (>10). Consider consolidating.');
  }

  // Prompts validation
  if (agentRecord.prompts && agentRecord.prompts.length > 10) {
    result.warnings.push('Too many prompts (>10). Consider consolidating.');
  }
}

async function validateUrls(agentRecord: AgentRecordYAML, result: ValidationResult): Promise<void> {
  const urlFields = [
    { field: 'imageURI', value: agentRecord.imageURI },
    { field: 'socials.website', value: agentRecord.socials?.website }
  ];

  for (const { field, value } of urlFields) {
    if (value && value.trim() !== '') {
      try {
        const url = new URL(value);
        
        // Only check HTTP/HTTPS URLs
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          try {
            const response = await fetch(value, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!response.ok) {
              result.warnings.push(`URL in ${field} returned status ${response.status}: ${value}`);
            }
          } catch (fetchError) {
            result.warnings.push(`URL in ${field} is not accessible: ${value}`);
          }
        }
      } catch (urlError) {
        result.errors.push(`Invalid URL in ${field}: ${value}`);
      }
    }
  }
}

export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validatePrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey) || /^[a-fA-F0-9]{64}$/.test(privateKey);
}