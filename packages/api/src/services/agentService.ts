import { ethers } from 'ethers';
import { Ensemble, AgentData, EnsembleConfig, AgentFilterParams, AgentRecord as SDKAgentRecord } from '@ensemble-ai/sdk';
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
      console.error('Failed to initialize SDK:', error.message);
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
        throw new Error('SDK not available - cannot fetch agents');
      }

      // Use the unified getAgentsByFilter method
      const filters: AgentFilterParams = {
        owner: params.owner,
        name: params.name,
        reputation_min: params.reputation_min,
        reputation_max: params.reputation_max,
        category: params.category,
        first: params.limit || 20,
        skip: ((params.page || 1) - 1) * (params.limit || 20)
      };
      
      console.log('Agent filters:', filters);
      const agents = await this.ensemble.agents.getAgentRecords(filters);
      
      // Transform SDK data to API format
      const transformedAgents = agents.map((agent: SDKAgentRecord) => this.transformSDKAgentRecord(agent));
      
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
        throw new Error('SDK not available - cannot fetch agent by ID');
      }
      
      // Use agent address as ID - SDK returns AgentRecord, transform to API format
      const sdkAgentRecord = await this.ensemble.getAgentRecord(agentId);
      return this.transformSDKAgentRecord(sdkAgentRecord);
      
    } catch (error: any) {
      console.error(`Error fetching agent ${agentId}:`, error);
      throw new Error(`Failed to fetch agent ${agentId}: ${error.message}`);
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
      return agents.map(agent => this.transformSDKAgentRecord(agent));
      
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
   * Transform SDK AgentRecord to API AgentRecord format
   */
  private transformSDKAgentRecord(sdkAgent: SDKAgentRecord): AgentRecord {
    const now = new Date().toISOString();
    const reputationScore = Number(sdkAgent.reputation) / 1e18;
    const totalRatingsCount = Number(sdkAgent.totalRatings);
    const id = sdkAgent.address.toLowerCase();
    
    return {
      id,
      name: sdkAgent.name,
      agentUri: sdkAgent.agentUri,
      owner: sdkAgent.owner,
      agent: sdkAgent.address,
      reputation: sdkAgent.reputation,
      totalRatings: sdkAgent.totalRatings,
      description: sdkAgent.description,
      imageURI: sdkAgent.imageURI,
      metadataURI: sdkAgent.agentUri,
      socials: sdkAgent.socials,
      agentCategory: sdkAgent.category,
      communicationType: sdkAgent.communicationType,
      attributes: sdkAgent.attributes,
      instructions: sdkAgent.instructions,
      prompts: sdkAgent.prompts,
      communicationURL: sdkAgent.communicationURL || '',
      communicationParams: sdkAgent.communicationParams || {},
      status: 'active',
      reputationScore,
      totalRatingsCount,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now
    };
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

}

export default AgentService;