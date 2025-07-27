import { AgentRecord, Pagination } from '../../types/agent';

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

export function generateMockAgents(): AgentRecord[] {
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
      communicationParams: {},
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
      communicationParams: {},
      status: 'active',
      reputationScore: 4.2,
      totalRatingsCount: 95,
      createdAt: new Date(baseTime - 86400000 * 20).toISOString(),
      updatedAt: new Date(baseTime - 1800000).toISOString(),
      lastActiveAt: new Date(baseTime - 600000).toISOString()
    }
  ];
}

export function getMockAgents(params: AgentQueryParams, applyFilters: (agents: AgentRecord[], params: AgentQueryParams) => AgentRecord[], applySorting: (agents: AgentRecord[], params: AgentQueryParams) => AgentRecord[]): { data: AgentRecord[], pagination: Pagination } {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const mockAgents = generateMockAgents();
  let filteredAgents = applyFilters(mockAgents, params);
  filteredAgents = applySorting(filteredAgents, params);
  const total = filteredAgents.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedAgents = filteredAgents.slice(offset, offset + limit);
  return {
    data: paginatedAgents,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
  };
}