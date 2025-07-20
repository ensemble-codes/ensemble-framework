"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
class AgentService {
    provider;
    agentRegistryAddress;
    serviceRegistryAddress;
    constructor(rpcUrl, agentRegistryAddress, serviceRegistryAddress) {
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.agentRegistryAddress = agentRegistryAddress;
        this.serviceRegistryAddress = serviceRegistryAddress;
    }
    /**
     * Get paginated list of agents with filtering
     */
    async getAgents(params) {
        const page = params.page || 1;
        const limit = Math.min(params.limit || 20, 100); // Max 100 per page
        // TODO: Implement actual blockchain interaction
        // For now, return mock data that matches the AgentRecord interface
        const mockAgents = this.generateMockAgents();
        // Apply filtering logic here
        let filteredAgents = mockAgents;
        if (params.category) {
            filteredAgents = filteredAgents.filter(agent => agent.agentCategory.toLowerCase() === params.category?.toLowerCase());
        }
        if (params.search) {
            const searchTerm = params.search.toLowerCase();
            filteredAgents = filteredAgents.filter(agent => agent.name.toLowerCase().includes(searchTerm) ||
                agent.description.toLowerCase().includes(searchTerm) ||
                agent.attributes.some(attr => attr.toLowerCase().includes(searchTerm)));
        }
        if (params.reputation_min !== undefined) {
            filteredAgents = filteredAgents.filter(agent => agent.reputationScore >= params.reputation_min);
        }
        if (params.owner) {
            filteredAgents = filteredAgents.filter(agent => agent.owner.toLowerCase() === params.owner?.toLowerCase());
        }
        // Apply sorting
        if (params.sort_by) {
            filteredAgents.sort((a, b) => {
                let aValue, bValue;
                switch (params.sort_by) {
                    case 'reputation':
                        aValue = a.reputationScore;
                        bValue = b.reputationScore;
                        break;
                    case 'name':
                        aValue = a.name;
                        bValue = b.name;
                        break;
                    case 'created_at':
                        aValue = new Date(a.createdAt);
                        bValue = new Date(b.createdAt);
                        break;
                    default:
                        aValue = new Date(a.updatedAt);
                        bValue = new Date(b.updatedAt);
                }
                if (params.sort_order === 'asc') {
                    return aValue > bValue ? 1 : -1;
                }
                else {
                    return aValue < bValue ? 1 : -1;
                }
            });
        }
        // Pagination
        const total = filteredAgents.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedAgents = filteredAgents.slice(offset, offset + limit);
        const pagination = {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        return {
            data: paginatedAgents,
            pagination
        };
    }
    /**
     * Get agent by ID
     */
    async getAgentById(agentId) {
        // TODO: Implement actual blockchain query
        const mockAgents = this.generateMockAgents();
        return mockAgents.find(agent => agent.id === agentId) || null;
    }
    /**
     * Get agents by owner address
     */
    async getAgentsByOwner(ownerAddress) {
        // TODO: Implement actual blockchain query
        const mockAgents = this.generateMockAgents();
        return mockAgents.filter(agent => agent.owner.toLowerCase() === ownerAddress.toLowerCase());
    }
    /**
     * Get available agent categories
     */
    async getAgentCategories() {
        // TODO: Implement actual blockchain query to get categories
        return [
            {
                category: 'ai-assistant',
                displayName: 'AI Assistant',
                description: 'General purpose AI assistants',
                agentCount: 25,
                icon: '🤖',
                subcategories: ['chat', 'research', 'writing']
            },
            {
                category: 'data-analysis',
                displayName: 'Data Analysis',
                description: 'Data processing and analytics agents',
                agentCount: 12,
                icon: '📊',
                subcategories: ['statistics', 'visualization', 'reporting']
            },
            {
                category: 'content-creation',
                displayName: 'Content Creation',
                description: 'Content generation and creative agents',
                agentCount: 18,
                icon: '✨',
                subcategories: ['writing', 'design', 'video']
            }
        ];
    }
    /**
     * Get available agent skills
     */
    async getAgentSkills() {
        // TODO: Implement actual blockchain query to aggregate skills
        return [
            {
                skill: 'python',
                displayName: 'Python Programming',
                agentCount: 15,
                category: 'data-analysis',
                related: ['pandas', 'numpy', 'sklearn']
            },
            {
                skill: 'research',
                displayName: 'Research & Analysis',
                agentCount: 22,
                category: 'ai-assistant',
                related: ['web-search', 'data-gathering', 'summarization']
            },
            {
                skill: 'writing',
                displayName: 'Content Writing',
                agentCount: 18,
                category: 'content-creation',
                related: ['copywriting', 'technical-writing', 'creative-writing']
            }
        ];
    }
    /**
     * Advanced agent discovery with complex filtering
     */
    async discoverAgents(discoveryParams) {
        // TODO: Implement complex discovery logic
        // For now, delegate to basic getAgents with converted params
        const params = {
            page: discoveryParams.pagination?.page || 1,
            limit: discoveryParams.pagination?.limit || 20,
            search: discoveryParams.query?.text,
            category: discoveryParams.query?.categories?.[0],
            reputation_min: discoveryParams.filters?.reputation?.min,
            reputation_max: discoveryParams.filters?.reputation?.max
        };
        return this.getAgents(params);
    }
    /**
     * Generate mock agent data for development
     */
    generateMockAgents() {
        const baseTime = Date.now();
        return [
            {
                id: 'agent-001',
                name: 'Research Assistant Pro',
                agentUri: 'https://ipfs.io/ipfs/QmResearch001',
                owner: '0x1234567890123456789012345678901234567890',
                agent: '0xAgent001',
                reputation: '4500000000000000000', // 4.5 * 10^18
                totalRatings: '120',
                description: 'Advanced AI research assistant specialized in academic research and data analysis',
                imageURI: 'https://ipfs.io/ipfs/QmImageResearch001',
                metadataURI: 'https://ipfs.io/ipfs/QmMetaResearch001',
                socials: {
                    twitter: '@research_pro',
                    telegram: '@research_assistant',
                    dexscreener: 'research-pro',
                    github: 'research-assistant-pro',
                    website: 'https://research-pro.ai'
                },
                agentCategory: 'ai-assistant',
                communicationType: 'websocket',
                attributes: ['research', 'data-analysis', 'academic-writing', 'fact-checking'],
                instructions: ['Send your research query', 'Specify sources if needed', 'Review results'],
                prompts: ['Research the latest developments in AI', 'Analyze this dataset', 'Fact-check this article'],
                communicationURL: 'wss://research-pro.ai/ws',
                communicationParams: { timeout: 30000 },
                status: 'active',
                reputationScore: 4.5,
                totalRatingsCount: 120,
                createdAt: new Date(baseTime - 86400000 * 30).toISOString(),
                updatedAt: new Date(baseTime - 3600000).toISOString(),
                lastActiveAt: new Date(baseTime - 900000).toISOString()
            },
            {
                id: 'agent-002',
                name: 'Code Review Expert',
                agentUri: 'https://ipfs.io/ipfs/QmCode002',
                owner: '0x2345678901234567890123456789012345678901',
                agent: '0xAgent002',
                reputation: '3800000000000000000', // 3.8 * 10^18
                totalRatings: '85',
                description: 'Expert code reviewer specializing in TypeScript, Python, and security audits',
                imageURI: 'https://ipfs.io/ipfs/QmImageCode002',
                metadataURI: 'https://ipfs.io/ipfs/QmMetaCode002',
                socials: {
                    twitter: '@code_expert',
                    telegram: '@code_reviewer',
                    dexscreener: 'code-expert',
                    github: 'code-review-expert'
                },
                agentCategory: 'data-analysis',
                communicationType: 'xmtp',
                attributes: ['code-review', 'typescript', 'python', 'security', 'best-practices'],
                instructions: ['Submit your code for review', 'Specify language and concerns', 'Receive detailed feedback'],
                prompts: ['Review this TypeScript function', 'Audit for security vulnerabilities', 'Suggest performance improvements'],
                communicationURL: 'https://code-expert.ai/api',
                status: 'active',
                reputationScore: 3.8,
                totalRatingsCount: 85,
                createdAt: new Date(baseTime - 86400000 * 45).toISOString(),
                updatedAt: new Date(baseTime - 7200000).toISOString(),
                lastActiveAt: new Date(baseTime - 1800000).toISOString()
            },
            {
                id: 'agent-003',
                name: 'Content Creator AI',
                agentUri: 'https://ipfs.io/ipfs/QmContent003',
                owner: '0x3456789012345678901234567890123456789012',
                agent: '0xAgent003',
                reputation: '4200000000000000000', // 4.2 * 10^18
                totalRatings: '95',
                description: 'Creative AI specialized in content writing, marketing copy, and social media',
                imageURI: 'https://ipfs.io/ipfs/QmImageContent003',
                metadataURI: 'https://ipfs.io/ipfs/QmMetaContent003',
                socials: {
                    twitter: '@content_ai',
                    telegram: '@content_creator',
                    dexscreener: 'content-ai',
                    website: 'https://content-creator.ai'
                },
                agentCategory: 'content-creation',
                communicationType: 'websocket',
                attributes: ['content-writing', 'copywriting', 'social-media', 'marketing', 'seo'],
                instructions: ['Describe your content needs', 'Provide target audience info', 'Review and approve content'],
                prompts: ['Write a blog post about blockchain', 'Create social media captions', 'Generate marketing copy'],
                communicationURL: 'wss://content-creator.ai/ws',
                status: 'active',
                reputationScore: 4.2,
                totalRatingsCount: 95,
                createdAt: new Date(baseTime - 86400000 * 20).toISOString(),
                updatedAt: new Date(baseTime - 1800000).toISOString(),
                lastActiveAt: new Date(baseTime - 600000).toISOString()
            }
        ];
    }
}
exports.default = AgentService;
//# sourceMappingURL=agentService.js.map