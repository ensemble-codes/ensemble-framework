import { BigNumberish } from "ethers";

export type AgentSocials = {
  twitter: string;
  telegram: string;
  dexscreener: string;
  github?: string;
  website?: string;
}

export type AgentCommunicationType = 'xmtp' | 'websocket';

export interface AgentRecord {
  // Core blockchain data
  name: string;
  agentUri: string;
  owner: string;
  agent: string;                           // Agent contract address
  reputation: BigNumberish;                // Raw reputation score from blockchain
  totalRatings: BigNumberish;              // Total number of ratings
  description: string;
  imageURI: string;                        // agent profile image
  metadataURI: string;                     // IPFS uri
  socials: AgentSocials;
  agentCategory: string;
  communicationType: AgentCommunicationType;
  attributes: string[];                    // Skills, capabilities, tags
  instructions: string[];                  // Setup/usage instructions  
  prompts: string[];                       // Example prompts for the agent
  communicationURL?: string;               // URL for agent communication
  communicationParams?: object;            // Additional communication parameters
  
  // API-specific enhancements
  id: string;                              // Normalized ID for API usage
  status: "active" | "inactive";           // Current agent status
  reputationScore: number;                 // Normalized reputation (0-5 scale)
  totalRatingsCount: number;               // Converted BigNumberish to number
  
  // Metadata
  createdAt: string;                       // ISO timestamp
  updatedAt: string;                       // ISO timestamp
  lastActiveAt?: string;                   // Last seen timestamp
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterInfo {
  applied: Record<string, any>;
  available: Record<string, any>;
}

export interface AgentListResponse {
  data: AgentRecord[];
  pagination: Pagination;
  filters: FilterInfo;
}

export interface AgentDetailResponse {
  data: AgentRecord;
}

export interface AgentCategory {
  category: string;
  displayName: string;
  description: string;
  agentCount: number;
  icon: string;
  subcategories: string[];
}

export interface AgentSkill {
  skill: string;
  displayName: string;
  agentCount: number;
  category: string;
  related: string[];
}

export interface AgentDiscoveryRequest {
  query: {
    text?: string;
    categories?: string[];
    tags?: string[];
    excludeTags?: string[];
  };
  filters?: {
    reputation?: {
      min?: number;
      max?: number;
    };
    pricing?: {
      min?: string;
      max?: string;
      tokens?: string[];
    };
    availability?: {
      responseTime?: number;
      timezone?: string;
      online?: boolean;
    };
    experience?: {
      minTasks?: number;
      successRate?: number;
    };
  };
  sort?: Array<{
    field: "reputation" | "price" | "responseTime" | "successRate";
    order: "asc" | "desc";
  }>;
  pagination?: {
    page: number;
    limit: number;
  };
}