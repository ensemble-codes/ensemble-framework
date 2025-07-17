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
  communicationParams?: object;
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

export interface AgentData {
  name: string;
  agentUri: string;
  owner: string;
  agent: string;
  reputation: BigNumberish;
  totalRatings: BigNumberish;
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

export interface ContractConfig {
  taskRegistryAddress: string;
  agentRegistryAddress: string;
  serviceRegistryAddress: string;
  network: NetworkConfig;
}

export type LegacyRegisterAgentParams = RegisterAgentParams;

export type LegacyAddProposalParams = Omit<AddProposalParams, 'tokenAddress'>;
