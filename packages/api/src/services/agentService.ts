import { ethers } from 'ethers';
import { Ensemble, AgentData, EnsembleConfig, AgentFilterParams } from '@ensemble-ai/sdk';
import { AgentRecord, AgentCategory, AgentSkill, Pagination } from '../types/agent';

interface AgentQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'all';
  owner?: string;
  reputation_min?: number;
  reputation_max?: number;
  attributes?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

class AgentService {
  private ensemble?: Ensemble;
  private agentRegistryAddress: string;
  private serviceRegistryAddress: string;
  private taskRegistryAddress: string;

  constructor(rpcUrl: string, agentRegistryAddress: string, serviceRegistryAddress: string, taskRegistryAddress: string, subgraphUrl?: string) {
    this.agentRegistryAddress = agentRegistryAddress;
    this.serviceRegistryAddress = serviceRegistryAddress;
    this.taskRegistryAddress = taskRegistryAddress;
    
    this.initializeSDK(rpcUrl, subgraphUrl).catch(error => {
      console.warn('Failed to initialize SDK, falling back to mock data:', error.message);
    });
  }

  private async initializeSDK(rpcUrl: string, subgraphUrl?: string): Promise<void> {
    try {
      // Create a read-only provider for querying data
      const readOnlyProvider = new ethers.JsonRpcProvider(rpcUrl);
      const dummySigner = ethers.Wallet.createRandom().connect(readOnlyProvider);
      
      const config: EnsembleConfig = {
        agentRegistryAddress: this.agentRegistryAddress,
        serviceRegistryAddress: this.serviceRegistryAddress,
        taskRegistryAddress: this.taskRegistryAddress,
        network: {
          chainId: 84532, // Base Sepolia
          name: 'Base Sepolia',
          rpcUrl
        },
        subgraphUrl
      };
      console.log('Ensemble SDK config:', config);
      this.ensemble = Ensemble.create(config, dummySigner);
      console.log('✅ SDK initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize SDK:', error.message);
      throw error;
    }
  }

  /**
   * Get paginated list of agents with filtering
   */
  async getAgents(params: AgentQueryParams): Promise<{ data: AgentRecord[], pagination: Pagination }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    
    try {
      // If SDK is not available, fall back to mock data
      if (!this.ensemble) {
        console.warn('SDK not available, using mock data');
        return this.getMockAgents(params);
      }

      // Use the unified getAgentsByFilter method
      const filters: AgentFilterParams = {
        owner: params.owner,
        name: params.name,
        reputation_min: params.reputation_min,
        reputation_max: params.reputation_max,
        // category filtering handled client-side since not available in subgraph
        first: params.limit || 20,
        skip: ((params.page || 1) - 1) * (params.limit || 20)
      };
      
      console.log('Agent filters:', filters);
      const agents = await this.ensemble.agents.getAgentsByFilter(filters);
      
      // Transform SDK data to API format
      const transformedAgents = agents.map(agent => this.transformAgentData(agent));
      
      // Apply client-side filtering for remaining parameters
      let filteredAgents = this.applyFilters(transformedAgents, params);
      
      // Apply sorting
      filteredAgents = this.applySorting(filteredAgents, params);
      
      // Apply pagination
      const total = filteredAgents.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedAgents = filteredAgents.slice(offset, offset + limit);
      
      const pagination: Pagination = {
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
      
    } catch (error: any) {
      console.error('Error fetching agents from blockchain:', error);
      console.warn('Falling back to mock data due to error:', error.message);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<AgentRecord | null> {
    try {
      if (!this.ensemble) {
        console.warn('SDK not available, using mock data');
        const mockAgents = this.generateMockAgents();
        return mockAgents.find(agent => agent.id === agentId) || null;
      }
      
      // Use agent address as ID
      const agentData = await this.ensemble.getAgent(agentId);
      return this.transformAgentData(agentData);
      
    } catch (error: any) {
      console.error(`Error fetching agent ${agentId}:`, error);
      // Fall back to mock data
      const mockAgents = this.generateMockAgents();
      return mockAgents.find(agent => agent.id === agentId) || null;
    }
  }

  /**
   * Get agents by owner address
   */
  async getAgentsByOwner(ownerAddress: string): Promise<AgentRecord[]> {
    try {
      if (!this.ensemble) {
        throw new Error('SDK not available - cannot fetch agents by owner');
      }
      
      const agents = await this.ensemble.getAgentsByOwner(ownerAddress);
      console.log('Agents by owner:', agents);
      return agents.map(agent => this.transformAgentData(agent));
      
    } catch (error: any) {
      console.error(`Error fetching agents for owner ${ownerAddress}:`, error);
      throw new Error(`Failed to fetch agents for owner ${ownerAddress}: ${error.message}`);
    }
  }

  /**
   * Get available agent categories
   */
  async getAgentCategories(): Promise<AgentCategory[]> {
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
  async getAgentSkills(): Promise<AgentSkill[]> {
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
  async discoverAgents(discoveryParams: any): Promise<{ data: AgentRecord[], pagination: Pagination }> {
    // Convert discovery params to AgentQueryParams format
    const params: AgentQueryParams = {
      page: discoveryParams.pagination?.page || 1,
      limit: discoveryParams.pagination?.limit || 20,
      name: discoveryParams.query?.text,
      category: discoveryParams.query?.categories?.[0],
      attributes: discoveryParams.query?.tags?.[0],
      reputation_min: discoveryParams.filters?.reputation?.min,
      reputation_max: discoveryParams.filters?.reputation?.max
    };
    
    return this.getAgents(params);
  }

  /**
   * Transform SDK AgentData to API AgentRecord format
   */
  private transformAgentData(sdkAgent: AgentData): AgentRecord {
    const now = new Date().toISOString();
    const reputationScore = Number(sdkAgent.reputation) / 1e18;
    const totalRatingsCount = Number(sdkAgent.totalRatings);
    const id = sdkAgent.agent.toLowerCase();
    
    return {
      id,
      name: sdkAgent.name,
      agentUri: sdkAgent.agentUri,
      owner: sdkAgent.owner,
      agent: sdkAgent.agent,
      reputation: sdkAgent.reputation,
      totalRatings: sdkAgent.totalRatings,
      description: `Agent ${sdkAgent.name} - Retrieved from blockchain`,
      imageURI: sdkAgent.agentUri,
      metadataURI: sdkAgent.agentUri,
      socials: { twitter: '', telegram: '', dexscreener: '', github: '', website: '' },
      agentCategory: 'general',
      communicationType: 'websocket',
      attributes: [],
      instructions: [],
      prompts: [],
      communicationURL: '',
      communicationParams: {},
      status: 'active',
      reputationScore,
      totalRatingsCount,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now
    };
  }

  private applyFilters(agents: AgentRecord[], params: AgentQueryParams): AgentRecord[] {
    let filtered = agents;
    
    // Apply category filtering (not available in subgraph schema)
    if (params.category) {
      filtered = filtered.filter(agent => 
        agent.agentCategory.toLowerCase() === params.category?.toLowerCase());
    }
    
    // Apply attributes filtering (not handled in SDK)
    if (params.attributes) {
      const searchTerm = params.attributes.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.attributes.some(attr => attr.toLowerCase().includes(searchTerm)));
    }
    
    // Apply status filtering (not handled in SDK)
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(agent => agent.status === params.status);
    }
    
    return filtered;
  }

  private applySorting(agents: AgentRecord[], params: AgentQueryParams): AgentRecord[] {
    if (!params.sort_by) return agents;
    return agents.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (params.sort_by) {
        case 'reputation': aValue = a.reputationScore; bValue = b.reputationScore; break;
        case 'name': aValue = a.name; bValue = b.name; break;
        case 'created_at': aValue = new Date(a.createdAt); bValue = new Date(b.createdAt); break;
        case 'total_tasks': aValue = a.totalRatingsCount; bValue = b.totalRatingsCount; break;
        default: aValue = new Date(a.updatedAt); bValue = new Date(b.updatedAt);
      }
      return params.sort_order === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }

  private getMockAgents(params: AgentQueryParams): { data: AgentRecord[], pagination: Pagination } {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const mockAgents = this.generateMockAgents();
    let filteredAgents = this.applyFilters(mockAgents, params);
    filteredAgents = this.applySorting(filteredAgents, params);
    const total = filteredAgents.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedAgents = filteredAgents.slice(offset, offset + limit);
    return {
      data: paginatedAgents,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    };
  }

  /**
   * Generate mock agent data for development
   */
  private generateMockAgents(): AgentRecord[] {
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

export default AgentService;