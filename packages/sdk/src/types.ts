import { BigNumberish } from "ethers";
import { BaseContract } from "ethers";
import {
  UpdateableAgentRecord,
} from './schemas/agent.schemas';

export interface TaskCreatedEvent {
  owner: string;
  task: string;
}

export interface AgentAssignedEvent {
  task: string;
  agent: string;
}

export interface ProposalAddedEvent {
  agent: string;
  proposalId: bigint;
  name: string;
  price: bigint;
  tokenAddress: string;
}

export interface ProposalRemovedEvent {
  agent: string;
  proposalId: bigint;
}

export interface ProposalUpdatedEvent {
  agent: string;
  proposalId: bigint;
  price: bigint;
  tokenAddress: string;
}

export interface ReputationUpdatedEvent {
  agent: string;
  newReputation: bigint;
}

export interface ProposalApprovedEvent {
  taskId: bigint;
  proposal: Proposal;
}

export interface TaskAssignedEvent {
  taskId: bigint;
  agent: string;
}

export interface TaskCanceledEvent {
  taskId: bigint;
}

export interface TaskCompletedEvent {
  taskId: bigint;
  result: string;
}

export interface TaskRatedEvent {
  taskId: bigint;
  rating: number;
}

export interface TaskStatusChangedEvent {
  taskId: bigint;
  status: TaskStatus;
}

// Re-export types from schemas
export {
  AgentSocials,
  AgentCommunicationType,
  ElizaParams,
  XMTPParams,
  CommunicationParams,
  AgentRecord,
  AgentMetadata,
  RegisterAgentParams,
  UpdateableAgentRecord,
  AgentStatus,
} from './schemas/agent.schemas';

// Type alias for serialized communication parameters (JSON string)
export type SerializedCommunicationParams = string;

export interface TaskConnectorContract extends BaseContract {
  execute(data: string, target: string, value: BigNumberish): Promise<{
    wait(): Promise<{ events: Array<{ event: string; args: { taskId: BigNumberish; success: boolean } }> }>;
  }>;
}

export enum TaskStatus {
  CREATED,
  ASSIGNED,
  COMPLETED,
  CANCELED
}

export interface TaskData {
  id: bigint;
  prompt: string;
  assignee?: string;
  status: bigint;
  issuer: string;
  proposalId: bigint;
  rating?: bigint;
}

export interface TaskExecutionData {
  id: bigint;
  prompt: string;
  issuer: string;
  assignee: string;
  serviceName: string;
  proposalId: bigint;
  status: bigint;
  params: {[key: string]: string}
}

export interface Proposal {
  id: bigint;
  issuer: string;
  price: BigNumberish;
  serviceName: string;
  tokenAddress: string;
  isActive: boolean;
}

export interface Skill {
  name: string;
  level: number;
}

export interface Service {
  name: string;
  category: string;
  description: string;
}



export interface AgentData {
  name: string;
  agentUri: string;
  owner: string;
  agent: string;
  reputation: BigNumberish;
  totalRatings: BigNumberish;
}

export interface AgentFilterParams {
  owner?: string;
  name?: string;
  reputation_min?: number;
  reputation_max?: number;
  category?: string;
  search?: string;
  first?: number;
  skip?: number;
}

export interface TaskCreationParams {
  prompt: string;
  proposalId: string;
}

export interface AddProposalParams {
  agentAddress: string;
  serviceName: string;
  servicePrice: BigNumberish;
  tokenAddress: string;
}




export interface NetworkConfig {
  chainId: number;
  name?: string;
  rpcUrl: string;
}

export interface EnsembleConfig {
  taskRegistryAddress: string;
  agentRegistryAddress: string;
  serviceRegistryAddress: string;
  network: NetworkConfig;
  subgraphUrl?: string;
}


export type LegacyAddProposalParams = Omit<AddProposalParams, 'tokenAddress'>;

// Agent Update Types
export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  success: boolean;
  events?: any[];
}



export type AgentRecordProperty = keyof UpdateableAgentRecord;

export class InvalidAgentIdError extends Error {
  constructor(agentId: string) {
    super(`Invalid agent ID format: ${agentId}`);
    this.name = 'InvalidAgentIdError';
  }
}

export class AgentNotFoundError extends Error {
  constructor(agentId: string) {
    super(`Agent not found: ${agentId}`);
    this.name = 'AgentNotFoundError';
  }
}

export class AgentUpdateError extends Error {
  constructor(message: string, public readonly cause?: any) {
    super(message);
    this.name = 'AgentUpdateError';
  }
}
