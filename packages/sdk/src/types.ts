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

export type AgentSocials = {
  twitter: string;
  telegram: string;
  dexscreener: string;
  github?: string;
}

export type AgentAttributes = [
  {
    trait_type: string;
    value: string;
  }
]

export type AgentMetadata = {
  name: string;
  description: string;
  imageURI: string;
  socials: AgentSocials;
  attributes: AgentAttributes;
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
  id: string;
  prompt: string;
  assignee?: string;
  status: TaskStatus;
  issuer: string;
  proposalId: string;
  rating?: number;
}

export interface Proposal {
  id: string;
  price: BigNumberish;
  taskId: string;
  agent: string;
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
  uri: string;
  owner?: string;
  address: string;
  reputation: BigNumberish;
}

export interface TaskCreationParams {
  prompt: string;
  proposalId: string;
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
