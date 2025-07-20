import { BigNumberish } from "ethers";
export type AgentSocials = {
    twitter: string;
    telegram: string;
    dexscreener: string;
    github?: string;
    website?: string;
};
export type AgentCommunicationType = 'xmtp' | 'websocket';
export interface AgentRecord {
    name: string;
    agentUri: string;
    owner: string;
    agent: string;
    reputation: BigNumberish;
    totalRatings: BigNumberish;
    description: string;
    imageURI: string;
    metadataURI: string;
    socials: AgentSocials;
    agentCategory: string;
    communicationType: AgentCommunicationType;
    attributes: string[];
    instructions: string[];
    prompts: string[];
    communicationURL?: string;
    communicationParams?: object;
    id: string;
    status: "active" | "inactive";
    reputationScore: number;
    totalRatingsCount: number;
    createdAt: string;
    updatedAt: string;
    lastActiveAt?: string;
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
//# sourceMappingURL=agent.d.ts.map