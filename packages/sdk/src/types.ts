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
  id: string;
  name: string;
  description: string;
}

export interface AgentData {
  address: string;
  model: string;
  prompt: string;
  skills: Skill[];
  reputation: BigNumberish;
  isRegistered: boolean;
}

export interface TaskCreationParams {
  prompt: string;
  serviceName: string;
  agentAddress: string;
}

export interface NetworkConfig {
  chainId: number;
  name?: string;
  rpcUrl: string;
}

export interface ContractConfig {
  taskRegistryAddress: string;
  agentRegistryAddress: string;
  network: NetworkConfig;
}
