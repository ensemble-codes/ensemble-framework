import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";
import {
  AgentData,
  AgentRecord,
  AgentMetadata,
  RegisterAgentParams,
  EnsembleConfig,
  TaskData,
  TaskCreationParams,
  Service,
} from "./types";
import { TaskService } from "./services/TaskService";
import { AgentService } from "./services/AgentService";
import { ServiceRegistryService } from "./services/ServiceRegistryService";
import {
  AgentsRegistry__factory,
  ServiceRegistry__factory,
  TaskRegistry__factory,
} from "../typechain";

export class Ensemble {
  private signer?: ethers.Signer;

  constructor(
    private readonly taskService: TaskService,
    private readonly agentService: AgentService,
    private readonly serviceRegistryService: ServiceRegistryService,
    signer?: ethers.Signer
  ) {
    this.signer = signer;
  }

  /**
   * Get the agent service instance
   */
  get agents(): AgentService {
    return this.agentService;
  }

  /**
   * Set the signer for write operations
   * @param {ethers.Signer} signer - The signer to use for write operations
   */
  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
    this.agentService.setSigner(signer);
    this.serviceRegistryService.setSigner(signer);
  }

  /**
   * Check if a signer is required for write operations
   * @private
   */
  private requireSigner(): void {
    if (!this.signer) {
      throw new Error("Signer required for write operations. Call setSigner() first.");
    }
  }

  static create(
    config: EnsembleConfig,
    signerOrProvider?: ethers.Signer | ethers.Provider,
    ipfsSDK?: PinataSDK
  ) {
    // Determine if we have a signer or just a provider
    const signer = signerOrProvider && 'getAddress' in signerOrProvider ? signerOrProvider : undefined;
    const provider = signerOrProvider || new ethers.JsonRpcProvider();

    const serviceRegistry = ServiceRegistry__factory.connect(
      config.serviceRegistryAddress,
      provider
    );

    const agentRegistry = AgentsRegistry__factory.connect(
      config.agentRegistryAddress,
      provider
    );

    const taskRegistry = TaskRegistry__factory.connect(
      config.taskRegistryAddress,
      provider
    );

    const serviceRegistryService = new ServiceRegistryService(serviceRegistry, signer);
    const agentService = new AgentService(agentRegistry, config.subgraphUrl, signer, ipfsSDK);
    const taskService = new TaskService(taskRegistry, agentService);

    return new Ensemble(taskService, agentService, serviceRegistryService, signer);
  }

  /**
   * Starts the Ensemble subscription to the task service.
   */
  async start() {
    this.taskService.subscribe();
  }

  async stop() {
    this.taskService.unsubscribe();
  }

  /**
   * Creates a new task.
   * @param {TaskCreationParams} params - The parameters for task creation.
   * @returns {Promise<TaskData>} A promise that resolves to the task ID.
   * @requires signer
   */
  async createTask(params: TaskCreationParams): Promise<TaskData> {
    this.requireSigner();
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
   * @returns {Promise<bigint[]>} A promise that resolves to the task IDs.
   */
  async getTasksByIssuer(issuer: string): Promise<bigint[]> {
    return this.taskService.getTasksByIssuer(issuer);
  }

  /**
   * Completes a task.
   * @param {string} taskId - The ID of the task.
   * @param {string} result - The result of the task.
   * @returns {Promise<void>} A promise that resolves when the task is completed.
   * @requires signer
   */
  async completeTask(taskId: string, result: string): Promise<void> {
    this.requireSigner();
    return this.taskService.completeTask(taskId, result);
  }

  /**
   * Assigns a rating to a task.
   * @param {string} taskId - The ID of the task.
   * @param {number} rating - The rating.
   * @returns {Promise<void>} A promise that resolves when the task is assigned.
   * @requires signer
   */
  async rateTask(taskId: string, rating: number): Promise<void> {
    this.requireSigner();
    return this.taskService.rateTask(taskId, rating);
  }

  /**
   * Cancels a task.
   * @param {string} taskId - The ID of the task.
   * @returns {Promise<void>} A promise that resolves when the task is canceled.
   * @requires signer
   */
  async cancelTask(taskId: string): Promise<void> {
    this.requireSigner();
    return this.taskService.cancelTask(taskId);
  }

  /**
   * Registers a new agent without service.
   * @param {string} address - The address of the agent.
   * @param {RegisterAgentParams} params - The registration parameters for the agent.
   * @returns {Promise<boolean>} A promise that resolves to the agent registration status.
   * @requires signer
   */
  async registerAgent(
    address: string,
    params: RegisterAgentParams
  ): Promise<boolean> {
    this.requireSigner();
    return this.agentService.registerAgent(
      address,
      params
    );
  }

  /**
   * Registers a new agent with service.
   * @param {string} address - The address of the agent.
   * @param {RegisterAgentParams} params - The registration parameters for the agent.
   * @param {string} serviceName - The name of the service.
   * @param {number} servicePrice - The price of the service.
   * @param {string} tokenAddress - The token address for payment.
   * @returns {Promise<boolean>} A promise that resolves to the agent registration status.
   * @requires signer
   */
  async registerAgentWithService(
    address: string,
    params: RegisterAgentParams,
    serviceName: string,
    servicePrice: number,
    tokenAddress: string = "0x0000000000000000000000000000000000000000" // Default to zero address for ETH
  ): Promise<boolean> {
    this.requireSigner();
    return this.agentService.registerAgentWithService(
      address,
      params,
      serviceName,
      servicePrice,
      tokenAddress
    );
  }

  /**
   * Gets the address of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   * @requires signer
   */
  async getWalletAddress(): Promise<string> {
    this.requireSigner();
    return this.agentService.getAgentAddress();
  }

  /**
   * Gets data for a specific agent.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<AgentRecord>} A promise that resolves to the agent record.
   */
  async getAgentRecord(agentId: string): Promise<AgentRecord> {
    return this.agentService.getAgentRecord(agentId);
  }

  /**
   * Updates the metadata of an existing agent.
   * @param {string} agentAddress - The address of the agent to update.
   * @param {AgentMetadata} metadata - The new metadata for the agent.
   * @returns {Promise<boolean>} A promise that resolves to true if the update was successful.
   * @requires signer
   */
  async updateAgentMetadata(
    agentAddress: string,
    metadata: AgentMetadata
  ): Promise<boolean> {
    this.requireSigner();
    return this.agentService.updateAgentMetadata(agentAddress, metadata);
  }

  /**
   * Gets all agents owned by a specific address.
   * @param {string} ownerAddress - The address of the owner.
   * @returns {Promise<AgentRecord[]>} A promise that resolves to an array of agent records.
   */
  async getAgentsByOwner(ownerAddress: string): Promise<AgentRecord[]> {
    return this.agentService.getAgentsByOwner(ownerAddress);
  }

  /**
   * Sets a listener for new tasks.
   * @param {function} listener - The listener function.
   * @returns {Promise<void>} A promise that resolves when the listener is set.
   */
  async setOnNewTaskListener(
    listener: (task: TaskData) => void
  ): Promise<void> {
    return this.taskService.setOnNewTaskListener(listener);
  }

  /**
   * Registers a new service.
   * @param {Service} service - The service to register.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the service is registered.
   * @requires signer
   */
  async registerService(service: Service): Promise<boolean> {
    this.requireSigner();
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

  /**
   * Add a proposal for an agent.
   * @param {string} agentAddress The address of the agent.
   * @param {string} serviceName The name of the service.
   * @param {number} servicePrice The price of the service.
   * @param {string} tokenAddress The token address for payment.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the proposal was added.
   * @requires signer
   */
  async addProposal(
    agentAddress: string,
    serviceName: string,
    servicePrice: number,
    tokenAddress: string
  ): Promise<boolean> {
    this.requireSigner();
    return this.agentService.addProposal(agentAddress, serviceName, servicePrice, tokenAddress);
  }
}

export default Ensemble;
