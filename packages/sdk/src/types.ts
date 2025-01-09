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

export interface TaskConnectorContract extends BaseContract {
  execute(data: string, target: string, value: BigNumberish): Promise<{
    wait(): Promise<{ events: Array<{ event: string; args: { taskId: BigNumberish; success: boolean } }> }>;
  }>;
}

export enum TaskType {
  SIMPLE,
  COMPLEX,
  COMPOSITE
}

export enum TaskStatus {
  CREATED,
  ASSIGNED,
  COMPLETED,
  FAILED
}

export interface TaskData {
  id: string;
  prompt: string;
  taskType: TaskType;
  assignee?: string;
  status: TaskStatus;
  owner: string;
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
  owner: string;
  address: string;
  reputation: BigNumberish;
  isRegistered: boolean;
  proposals: Proposal[];
}

export interface TaskCreationParams {
  prompt: string;
  taskType: TaskType;
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
