import { AgentRecord, AgentCategory, AgentSkill, Pagination } from '../types/agent';
interface AgentQueryParams {
    page?: number;
    limit?: number;
    category?: string;
    status?: 'active' | 'inactive' | 'all';
    owner?: string;
    reputation_min?: number;
    reputation_max?: number;
    search?: string;
    tags?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    service_name?: string;
    price_min?: string;
    price_max?: string;
    token_address?: string;
}
declare class AgentService {
    private provider;
    private agentRegistryAddress;
    private serviceRegistryAddress;
    constructor(rpcUrl: string, agentRegistryAddress: string, serviceRegistryAddress: string);
    /**
     * Get paginated list of agents with filtering
     */
    getAgents(params: AgentQueryParams): Promise<{
        data: AgentRecord[];
        pagination: Pagination;
    }>;
    /**
     * Get agent by ID
     */
    getAgentById(agentId: string): Promise<AgentRecord | null>;
    /**
     * Get agents by owner address
     */
    getAgentsByOwner(ownerAddress: string): Promise<AgentRecord[]>;
    /**
     * Get available agent categories
     */
    getAgentCategories(): Promise<AgentCategory[]>;
    /**
     * Get available agent skills
     */
    getAgentSkills(): Promise<AgentSkill[]>;
    /**
     * Advanced agent discovery with complex filtering
     */
    discoverAgents(discoveryParams: any): Promise<{
        data: AgentRecord[];
        pagination: Pagination;
    }>;
    /**
     * Generate mock agent data for development
     */
    private generateMockAgents;
}
export default AgentService;
//# sourceMappingURL=agentService.d.ts.map