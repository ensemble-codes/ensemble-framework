import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import { AgentData, AgentMetadata, ContractConfig, TaskData, TaskCreationParams, Service } from "./types";
import { ContractService } from "./services/ContractService";
import { TaskService } from "./services/TaskService";
import { AgentService } from "./services/AgentService";
import { ServiceRegistryService } from "./services/ServiceRegistryService";
import TaskRegistryABI from './abi/TaskRegistry.abi.json';
import AgentRegistryABI from './abi/AgentsRegistry.abi.json';
import ServiceRegistryABI from './abi/ServiceRegistry.abi.json';

export class Ensemble {
  private contractService: ContractService;
  private taskService: TaskService;
  private agentService: AgentService;
  private serviceRegistryService: ServiceRegistryService;

  constructor(
    contractService: ContractService,
    taskService: TaskService,
    agentService: AgentService,
    serviceRegisterService: ServiceRegistryService
  ) {
    this.contractService = contractService;
    this.taskService = taskService;
    this.agentService = agentService;
    this.serviceRegistryService = serviceRegisterService;
  }

  static create(config: ContractConfig, signer: ethers.Signer, ipfsSDK: PinataSDK) { 
    const contractService = new ContractService(
      new ethers.JsonRpcProvider(config.network.rpcUrl),
      signer
    );

    // Initialize services
    const serviceRegistry = contractService.createContract(
      config.serviceRegistryAddress,
      ServiceRegistryABI
    );

    const agentRegistry = contractService.createContract(
      config.agentRegistryAddress,
      AgentRegistryABI
    );

    const taskRegistry = contractService.createContract(
      config.taskRegistryAddress,
      TaskRegistryABI
    );

    const serviceRegistryService = new ServiceRegistryService(serviceRegistry);
    const agentService = new AgentService(agentRegistry, signer, ipfsSDK);
    const taskService = new TaskService(taskRegistry, agentService);

    return new Ensemble(contractService, taskService, agentService, serviceRegistryService);
  }

  /**
   * Starts the Ensemble subscription to the task service.
   */
  async start() {
    this.taskService.subscribe()
  }

  async stop() {
    this.taskService.unsubscribe()
  }

  /**
   * Creates a new task.
   * @param {TaskCreationParams} params - The parameters for task creation.
   * @returns {Promise<TaskData>} A promise that resolves to the task ID.
   */
  async createTask(params: TaskCreationParams): Promise<TaskData> {
    return this.taskService.createTask(params);
  }

  /**
   * Gets data for a specific task.
   * @param {string} taskId - The ID of the task.
   * @returns {Promise<TaskData>} A promise that resolves to the task data.
   */
  async getTaskData(taskId: string): Promise<TaskData> {
    return this.taskService.getTaskData(taskId);
  }

  /**
   * Gets tasks by issuer.
   * @param {string} issuer - The owner of the tasks.
   * @returns {Promise<string[]>} A promise that resolves to the task IDs.
   */
  async getTasksByIssuer(issuer: string): Promise<TaskData[]> {
    return this.taskService.getTasksByIssuer(issuer);
  }

  /**
   * Completes a task.
   * @param {string} taskId - The ID of the task.
   * @param {string} result - The result of the task.
   * @returns {Promise<void>} A promise that resolves when the task is completed.
   */
  async completeTask(taskId: string, result: string): Promise<void> {
    return this.taskService.completeTask(taskId, result);
  }
  
  /**
   * Registers a new agent.
   * @param {string} address - The address of the agent.
   * @param {AgentMetadata} metadata - The metadata of the agent.
   * @param {string} serviceName - The name of the service.
   * @param {number} servicePrice - The price of the service.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async registerAgent(address: string, metadata: AgentMetadata, serviceName: string, servicePrice: number): Promise<boolean> {
    return this.agentService.registerAgent(address, metadata, serviceName, servicePrice);
  }

  /**
   * Gets the address of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async getWalletAddress(): Promise<string> {
    return this.agentService.getAddress();
  }

  /**
   * Gets data for a specific agent.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<AgentData>} A promise that resolves to the agent data.
   */
  async getAgent(agentId: string): Promise<AgentData> {
    return this.agentService.getAgent(agentId);
  }

   /**
   * Gets all the agents for a specific service.
   * @param {string} serviceId - The id of the service.
   * @returns {Promise<AgentData>} A promise that resolves to a list of agent data.
   */
   async getAgentsByServiceId(serviceId: string): Promise<AgentData[]> {
    return this.agentService.getAgentsByServiceId(serviceId);
  }

  /**
   * Checks if an agent is registered.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the agent is registered.
   */
  async isAgentRegistered(agentId: string): Promise<boolean> {
    return this.agentService.isAgentRegistered(agentId);
  }

  /**
   * Sets a listener for new tasks.
   * @param {function} listener - The listener function.
   * @returns {Promise<void>} A promise that resolves when the listener is set.
   */
  async setOnNewTaskListener(listener: (task: TaskData) => void) {
    return this.taskService.setOnNewTaskListener(listener);
  }

  /**
   * Registers a new service.
   * @param {Service} service - The service to register.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the service is registered.
   */
  async registerService(service: Service): Promise<boolean> {
    return this.serviceRegistryService.registerService(service);
  }

  /**
   * Gets a service by name.
   * @param {string} name - The name of the service.
   * @returns {Promise<Service>} A promise that resolves to the service.
   */
  async getService(name: string): Promise<Service> {
    return this.serviceRegistryService.getService(name);
  }
} 

export default Ensemble;