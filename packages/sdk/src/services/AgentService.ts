import { ethers } from "ethers";
import { AgentData, Proposal, AgentMetadata } from "../types";
import {
  AgentAlreadyRegisteredError,
  ServiceNotRegisteredError,
} from "../errors";
import { PinataSDK } from "pinata-web3";

export class AgentService {
  constructor(
    private agentRegistry: ethers.Contract,
    private signer: ethers.Signer,
    private ipfsSDK: PinataSDK
  ) {}

  /**
   * Gets the address of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent address.
   */
  async getAddress(): Promise<string> {
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
      debugger;
      console.log(`registering agent ${address} with metadata: ${metadata}`);
      const uploadResponse = await this.ipfsSDK.upload.json(metadata);
      metadata;
      const agentURI = `ipfs://${uploadResponse.IpfsHash}`;

      const tx = await this.agentRegistry.registerAgent(
        address,
        metadata.name,
        agentURI,
        serviceName,
        servicePrice
      );
      console.log(`transaction to register agent was sent. tx: ${tx}`);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction reverted: Agent registration failed");
      }

      const event = this.findEventInReceipt(receipt, "AgentRegistered");
      if (!event?.args) {
        throw new Error("Agent registration failed: Event not emitted");
      }
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

  findEventInReceipt(receipt: any, eventName: string): ethers.EventLog {
    const events = receipt.logs
      .map((log: any) => {
        try {
          const event = this.agentRegistry.interface.parseLog(log);
          return event;
        } catch (e) {
          console.error("error:", e);
          return null;
        }
      })
      .filter((event: any) => event !== null);
    const event = events?.find((e: { name: string }) => e.name === eventName);
    return event;
  }

  /**
   * Gets data for a specific agent.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<AgentData>} A promise that resolves to the agent data.
   */
  async getAgent(agentAddress: string): Promise<AgentData> {
    const [name, uri, address, reputation, proposals] =
      await this.agentRegistry.getAgentData(agentAddress);
    const isRegistered = await this.agentRegistry.isRegistered(agentAddress);

    return {
      name,
      uri,
      address,
      reputation,
    };
  }

  /**
   * Checks if an agent is registered.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the agent is registered.
   */
  async isAgentRegistered(agentAddress: string): Promise<boolean> {
    return await this.agentRegistry.isRegistered(agentAddress);
  }

  /**
   * Gets all the agents for a specific service.
   * @param {string} serviceName - The name of the service.
   * @returns {Promise<AgentData>} A promise that resolves to a list of agent data.
   */
  async getAgentsByServiceId(serviceId: string): Promise<AgentData[]> {
    const agentAddresses: string[] =
      await this.agentRegistry.getAgentsByServiceId(serviceId);

    const agents: AgentData[] = [];
    for (const address of agentAddresses) {
      const agent = await this.agentRegistry.getAgentData(address);
      agents.push({
        name: agent[0],
        uri: agent[1],
        owner: agent[2],
        address: agent[3],
        reputation: agent[4],
      });
    }
    return agents;
  }

  /**
   * Gets a proposal by ID.
   * @param {string} proposalId - The ID of the proposal.
   * @returns {Promise<Proposal>} A promise that resolves to the proposal.
   */
  async getProposal(proposalId: string): Promise<Proposal> {
    return this.agentRegistry.getProposal(proposalId);
  }

  /**
   * The reputation of an agent.
   * @param {string} agentAddress The address of the agent
   * @returns {Promise<number>} A promise that resolves to the reputation of the agent.
   */
  async getReputation(agentAddress: string): Promise<number> {
    return this.agentRegistry.getReputation(agentAddress);
  }
}
