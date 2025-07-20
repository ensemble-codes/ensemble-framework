"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDefinitions = void 0;
exports.swaggerDefinitions = {
    AgentRecord: {
        type: 'object',
        required: ['id', 'name', 'description', 'owner', 'agent', 'status', 'reputationScore', 'agentCategory'],
        properties: {
            id: { type: 'string', description: 'Unique agent identifier' },
            name: { type: 'string', description: 'Agent display name' },
            description: { type: 'string', description: 'Detailed agent description' },
            owner: { type: 'string', description: 'Ethereum address of agent owner' },
            agent: { type: 'string', description: 'Agent contract address' },
            status: { type: 'string', enum: ['active', 'inactive'], description: 'Current agent status' },
            reputationScore: { type: 'number', minimum: 0, maximum: 5, description: 'Normalized reputation score' },
            totalRatingsCount: { type: 'integer', minimum: 0, description: 'Total number of ratings received' },
            agentCategory: { type: 'string', description: 'Primary agent category' },
            communicationType: { type: 'string', enum: ['xmtp', 'websocket'], description: 'Preferred communication method' },
            attributes: { type: 'array', items: { type: 'string' }, description: 'Agent skills and capabilities' },
            instructions: { type: 'array', items: { type: 'string' }, description: 'Usage instructions' },
            prompts: { type: 'array', items: { type: 'string' }, description: 'Example prompts' },
            imageURI: { type: 'string', format: 'uri', description: 'Agent profile image URL' },
            metadataURI: { type: 'string', format: 'uri', description: 'IPFS metadata URI' },
            socials: { $ref: '#/definitions/AgentSocials' },
            communicationURL: { type: 'string', format: 'uri', description: 'Communication endpoint URL' },
            communicationParams: { type: 'object', description: 'Additional communication parameters' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
            lastActiveAt: { type: 'string', format: 'date-time', description: 'Last activity timestamp' }
        }
    },
    AgentSocials: {
        type: 'object',
        required: ['twitter', 'telegram', 'dexscreener'],
        properties: {
            twitter: { type: 'string', description: 'Twitter handle or URL' },
            telegram: { type: 'string', description: 'Telegram handle or URL' },
            dexscreener: { type: 'string', format: 'uri', description: 'DEXScreener token URL' },
            github: { type: 'string', format: 'uri', description: 'GitHub repository URL' },
            website: { type: 'string', format: 'uri', description: 'Official website URL' }
        }
    },
    Pagination: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'],
        properties: {
            page: { type: 'integer', minimum: 1, description: 'Current page number' },
            limit: { type: 'integer', minimum: 1, description: 'Items per page' },
            total: { type: 'integer', minimum: 0, description: 'Total number of items' },
            totalPages: { type: 'integer', minimum: 0, description: 'Total number of pages' },
            hasNext: { type: 'boolean', description: 'Whether there is a next page' },
            hasPrev: { type: 'boolean', description: 'Whether there is a previous page' }
        }
    },
    FilterInfo: {
        type: 'object',
        required: ['applied', 'available'],
        properties: {
            applied: { type: 'object', description: 'Currently applied filters' },
            available: { type: 'object', description: 'Available filter options' }
        }
    },
    ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
            error: {
                type: 'object',
                required: ['code', 'message', 'timestamp'],
                properties: {
                    code: { type: 'string', description: 'Error code' },
                    message: { type: 'string', description: 'Human-readable error message' },
                    timestamp: { type: 'string', format: 'date-time', description: 'Error occurrence timestamp' },
                    details: { type: 'object', description: 'Additional error details' },
                    stack: { type: 'string', description: 'Error stack trace (development only)' }
                }
            }
        },
        example: {
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                timestamp: '2024-07-20T14:22:00Z',
                details: {
                    field: 'agentId',
                    issue: 'must be a valid string'
                }
            }
        }
    }
};
//# sourceMappingURL=definitions.js.map