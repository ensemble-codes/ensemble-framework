"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgentRecordYAML = validateAgentRecordYAML;
exports.validateEthereumAddress = validateEthereumAddress;
exports.validatePrivateKey = validatePrivateKey;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const yaml_1 = require("yaml");
async function validateAgentRecordYAML(filepath, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    try {
        // Check if file exists
        if (!(0, fs_1.existsSync)(filepath)) {
            result.errors.push(`File not found: ${filepath}`);
            result.valid = false;
            return result;
        }
        // Read and parse YAML
        const fileContent = await (0, promises_1.readFile)(filepath, 'utf-8');
        let agentRecord;
        try {
            agentRecord = (0, yaml_1.parse)(fileContent);
        }
        catch (parseError) {
            result.errors.push(`YAML parsing error: ${parseError.message}`);
            result.valid = false;
            return result;
        }
        // Validate schema
        validateSchema(agentRecord, result);
        if (!options.schemaOnly) {
            // Additional validations
            validateBusinessRules(agentRecord, result);
            if (options.checkUrls) {
                await validateUrls(agentRecord, result);
            }
        }
    }
    catch (error) {
        result.errors.push(`Validation error: ${error.message}`);
        result.valid = false;
    }
    result.valid = result.errors.length === 0;
    return result;
}
function validateSchema(agentRecord, result) {
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
        const validCommTypes = ['websocket', 'xmtp'];
        if (!validCommTypes.includes(agentRecord.communication.type)) {
            result.errors.push(`Invalid communication type. Must be one of: ${validCommTypes.join(', ')}`);
        }
    }
    // Validate status
    if (agentRecord.status) {
        const validStatuses = ['active', 'inactive', 'maintenance'];
        if (!validStatuses.includes(agentRecord.status)) {
            result.errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
    }
}
function validateBusinessRules(agentRecord, result) {
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
async function validateUrls(agentRecord, result) {
    const urlFields = [
        { field: 'imageURI', value: agentRecord.imageURI },
        { field: 'communication.url', value: agentRecord.communication?.url },
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
                    }
                    catch (fetchError) {
                        result.warnings.push(`URL in ${field} is not accessible: ${value}`);
                    }
                }
            }
            catch (urlError) {
                result.errors.push(`Invalid URL in ${field}: ${value}`);
            }
        }
    }
}
function validateEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
function validatePrivateKey(privateKey) {
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey) || /^[a-fA-F0-9]{64}$/.test(privateKey);
}
//# sourceMappingURL=validation.js.map