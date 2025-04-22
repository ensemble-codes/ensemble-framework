import { ethers } from "ethers";
import { AgentData, Proposal, AgentMetadata } from "../types";
import {
  AgentAlreadyRegisteredError,
  ServiceNotRegisteredError,
} from "../errors";
import { PinataSDK } from "pinata-web3";
import { AgentsRegistry } from "../../typechain";

export class AgentService {
  constructor(
    private readonly agentRegistry: AgentsRegistry,
    private readonly signer: ethers.Signer,
    private readonly ipfsSDK?: PinataSDK
  ) {}

  /**
   * Gets the address of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent.
   */
  async getAgentAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  /**
   * Registers a new agent.
   * @param {string} address - The address of the agent..
   * @param {AgentMetadata} metadata - The metadata of the agent.
   * @param {string} serviceName - The name of the service.
   * @param {number} servicePrice - The price of the service.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async registerAgent(
    address: string,
    metadata: AgentMetadata,
    serviceName: string,
    servicePrice: number
  ): Promise<boolean> {
    try {
      if (!this.ipfsSDK) {
        throw new Error("IPFS SDK is not initialized");
      }
      console.log(`registering agent ${address} with metadata: ${metadata}`);
      
      const uploadResponse = await this.ipfsSDK.upload.json(metadata);
      const agentURI = `ipfs://${uploadResponse.IpfsHash}`;

      const tx = await this.agentRegistry.registerAgent(
        address,
        metadata.name,
        agentURI,
        serviceName,
        servicePrice
      );

      console.log(`transaction to register agent was sent. tx: ${tx}`);
      
      await tx.wait();

      return true;
    } catch (error: any) {
      console.error({ error });
      if (error.reason === "Service not registered") {
        throw new ServiceNotRegisteredError(error.reason);
      } else if (error.reason === "Agent already registered") {
        throw new AgentAlreadyRegisteredError(error.reason);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add a proposal for an agent.
   * @param {string} agentAddress The address of the agent.
   * @param {string} serviceName The name of the service.
   * @param {number} servicePrice The price of the service.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the proposal was added.
   */
  async addProposal(
    agentAddress: string,
    serviceName: string,
    servicePrice: number
  ): Promise<boolean> {
    try {
      const tx = await this.agentRegistry.addProposal(
        agentAddress,
        serviceName,
        servicePrice
      );

      const receipt = await tx.wait();

      return receipt ? true : false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Remove the proposal of an agent.
   * @param {string} agentAddress The address of the agent.
   * @param {string} proposalId The ID of the proposal.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the proposal was removed.
   */
  async removeProposal(
    agentAddress: string,
    proposalId: string
  ): Promise<boolean> {
    try {
      const tx = await this.agentRegistry.removeProposal(
        agentAddress,
        proposalId
      );

      const receipt = await tx.wait();

      return receipt ? true : false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Gets data for a specific agent.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<AgentData>} A promise that resolves to the agent data.
   */
  async getAgent(agentAddress: string): Promise<AgentData> {
    const { name, agentUri, owner, agent, reputation, totalRatings } =
      await this.agentRegistry.getAgentData(agentAddress);

    return {
      name,
      agentUri,
      owner,
      agent,
      reputation,
      totalRatings,
    };
  }

  /**
   * Gets a proposal by ID.
   * @param {string} proposalId - The ID of the proposal.
   * @returns {Promise<Proposal>} A promise that resolves to the proposal.
   */
  async getProposal(proposalId: string): Promise<Proposal> {
    const {
      proposalId: id,
      issuer,
      price,
      serviceName,
      isActive,
    } = await this.agentRegistry.getProposal(proposalId);

    return {
      id,
      issuer,
      price,
      serviceName,
      isActive,
    };
  }

  /**
   * The reputation of an agent.
   * @param {string} agentAddress The address of the agent
   * @returns {Promise<bigint>} A promise that resolves to the reputation of the agent.
   */
  async getReputation(agentAddress: string): Promise<bigint> {
    return this.agentRegistry.getReputation(agentAddress);
  }
}
