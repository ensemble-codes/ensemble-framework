import { BigNumberish } from "ethers";
import { Contract, BaseContract, ContractRunner } from "ethers";

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

export type AgentSocials = {
  twitter: string;
  telegram: string;
  dexscreener: string;
  github?: string;
  website?: string;
}

export type AgentCommunicationType = 'xmtp' | 'websocket';

export type AgentMetadata = {
  name: string;
  description: string;
  imageURI: string;
  socials: AgentSocials;
  agentCategory: string;
  openingGreeting: string;
  communicationType: AgentCommunicationType;
  attributes: string[];
  instructions: string[];
  prompts: string[];
  communicationURL?: string;
  communicationParams?: string;
}

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


export interface AgentRecord {
  name: string; // The display name of the agent
  description: string; // A brief description of the agent
  address: string; // The blockchain address of the agent
  category: string; // The category or type of the agent
  owner: string; // The address of the agent's owner
  agentUri: string; // URI pointing to agent metadata or resources
  imageURI: string; // URI for the agent's image or avatar
  attributes: string[]; // List of agent's attributes or tags
  instructions: string[]; // List of instructions for interacting with the agent
  prompts: string[]; // Example prompts or tasks for the agent
  socials: AgentSocials; // Social media or contact information for the agent
  communicationType: AgentCommunicationType; // Type of communication supported by the agent
  communicationURL?: string; // Optional URL for communication endpoint
  communicationParams?: string; // Optional parameters for communication setup
  reputation: BigNumberish; // Agent's reputation score
  totalRatings: BigNumberish; // Total number of ratings received by the agent
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

export interface registerAgentWithServiceParams {
  agentAddress: string;
  name: string;
  agentUri: string;
  serviceName: string;
  servicePrice: BigNumberish;
  tokenAddress: string;
}

export interface RegisterAgentParams {
  agentAddress: string;
  name: string;
  agentUri: string;
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

export type LegacyRegisterAgentParams = RegisterAgentParams;

export type LegacyAddProposalParams = Omit<AddProposalParams, 'tokenAddress'>;

// Agent Update Types
export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  success: boolean;
  events?: any[];
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended'
}

export interface UpdateableAgentRecord {
  name?: string;
  description?: string;
  category?: string;
  imageURI?: string;
  attributes?: string[];
  instructions?: string[];
  prompts?: string[];
  socials?: Partial<AgentSocials>;
  communicationType?: AgentCommunicationType;
  communicationURL?: string;
  communicationParams?: string;
  status?: AgentStatus;
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
