export declare const swaggerDefinitions: {
    AgentRecord: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            owner: {
                type: string;
                description: string;
            };
            agent: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            reputationScore: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            totalRatingsCount: {
                type: string;
                minimum: number;
                description: string;
            };
            agentCategory: {
                type: string;
                description: string;
            };
            communicationType: {
                type: string;
                enum: string[];
                description: string;
            };
            attributes: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            instructions: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            prompts: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            imageURI: {
                type: string;
                format: string;
                description: string;
            };
            metadataURI: {
                type: string;
                format: string;
                description: string;
            };
            socials: {
                $ref: string;
            };
            communicationURL: {
                type: string;
                format: string;
                description: string;
            };
            communicationParams: {
                type: string;
                description: string;
            };
            createdAt: {
                type: string;
                format: string;
                description: string;
            };
            updatedAt: {
                type: string;
                format: string;
                description: string;
            };
            lastActiveAt: {
                type: string;
                format: string;
                description: string;
            };
        };
    };
    AgentSocials: {
        type: string;
        required: string[];
        properties: {
            twitter: {
                type: string;
                description: string;
            };
            telegram: {
                type: string;
                description: string;
            };
            dexscreener: {
                type: string;
                format: string;
                description: string;
            };
            github: {
                type: string;
                format: string;
                description: string;
            };
            website: {
                type: string;
                format: string;
                description: string;
            };
        };
    };
    Pagination: {
        type: string;
        required: string[];
        properties: {
            page: {
                type: string;
                minimum: number;
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                description: string;
            };
            total: {
                type: string;
                minimum: number;
                description: string;
            };
            totalPages: {
                type: string;
                minimum: number;
                description: string;
            };
            hasNext: {
                type: string;
                description: string;
            };
            hasPrev: {
                type: string;
                description: string;
            };
        };
    };
    FilterInfo: {
        type: string;
        required: string[];
        properties: {
            applied: {
                type: string;
                description: string;
            };
            available: {
                type: string;
                description: string;
            };
        };
    };
    ErrorResponse: {
        type: string;
        required: string[];
        properties: {
            error: {
                type: string;
                required: string[];
                properties: {
                    code: {
                        type: string;
                        description: string;
                    };
                    message: {
                        type: string;
                        description: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    details: {
                        type: string;
                        description: string;
                    };
                    stack: {
                        type: string;
                        description: string;
                    };
                };
            };
        };
        example: {
            error: {
                code: string;
                message: string;
                timestamp: string;
                details: {
                    field: string;
                    issue: string;
                };
            };
        };
    };
};
//# sourceMappingURL=definitions.d.ts.map