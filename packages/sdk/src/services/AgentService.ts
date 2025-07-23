import { ethers } from "ethers";
import { AgentData, Proposal, AgentMetadata } from "../types";
import {
  AgentAlreadyRegisteredError,
  ServiceNotRegisteredError,
} from "../errors";
import { PinataSDK } from "pinata-web3";
import { AgentsRegistry } from "../../typechain";
import { GraphQLClient, gql } from "graphql-request";

// Subgraph types
interface SubgraphAgent {
  id: string;
  name: string;
  agentUri: string;
  owner: string;
  reputation: string;
  metadata?: {
    name: string;
    description: string;
    imageUri: string;
  };
  proposals: Array<{
    id: string;
    service: string;
    price: string;
  }>;
}

interface GetAgentsByOwnerQuery {
  agents: SubgraphAgent[];
}

export class AgentService {
  private subgraphClient?: GraphQLClient;

  constructor(
    private readonly agentRegistry: AgentsRegistry,
    private readonly signer: ethers.Signer,
    private readonly ipfsSDK?: PinataSDK,
    subgraphUrl?: string
  ) {
    if (subgraphUrl) {
      this.subgraphClient = new GraphQLClient(subgraphUrl);
    }
  }

  /**
   * Gets the address of the agent.
   * @returns {Promise<string>} A promise that resolves to the agent.
   */
  async getAgentAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  /**
   * Registers a new agent without service.
   * @param {string} address - The address of the agent.
   * @param {AgentMetadata} metadata - The metadata of the agent.
   * @returns {Promise<boolean>} A promise that resolves to the agent registration status.
   */
  async registerAgent(
    address: string,
    metadata: AgentMetadata
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
        agentURI
      );

      console.log(`transaction to register agent was sent. tx: ${tx}`);
      
      await tx.wait();

      return true;
    } catch (error: any) {
      console.error({ error });
      if (error.reason === "Agent already registered") {
        throw new AgentAlreadyRegisteredError(error.reason);
      } else {
        throw error;
      }
    }
  }

  /**
   * Registers a new agent with service.
   * @param {string} address - The address of the agent..
   * @param {AgentMetadata} metadata - The metadata of the agent.
   * @param {string} serviceName - The name of the service.
   * @param {number} servicePrice - The price of the service.
   * @param {string} tokenAddress - The token address for payment.
   * @returns {Promise<boolean>} A promise that resolves to the agent registration status.
   */
  async registerAgentWithService(
    address: string,
    metadata: AgentMetadata,
    serviceName: string,
    servicePrice: number,
    tokenAddress: string = "0x0000000000000000000000000000000000000000" // Default to zero address for ETH
  ): Promise<boolean> {
    try {
      if (!this.ipfsSDK) {
        throw new Error("IPFS SDK is not initialized");
      }
      console.log(`registering agent ${address} with metadata: ${metadata}`);
      
      const uploadResponse = await this.ipfsSDK.upload.json(metadata);
      const agentURI = `ipfs://${uploadResponse.IpfsHash}`;

      const tx = await this.agentRegistry.registerAgentWithService(
        address,
        metadata.name,
        agentURI,
        serviceName,
        servicePrice,
        tokenAddress
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
   * @param {string} tokenAddress The token address for payment.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the proposal was added.
   */
  async addProposal(
    agentAddress: string,
    serviceName: string,
    servicePrice: number,
    tokenAddress: string
  ): Promise<boolean> {
    try {
      const tx = await this.agentRegistry.addProposal(
        agentAddress,
        serviceName,
        servicePrice,
        tokenAddress
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
      tokenAddress,
      isActive,
    } = await this.agentRegistry.getProposal(proposalId);

    return {
      id,
      issuer,
      price,
      serviceName,
      tokenAddress,
      isActive,
    };
  }

  /**
   * Updates the metadata of an existing agent.
   * @param {string} agentAddress - The address of the agent to update.
   * @param {AgentMetadata} metadata - The new metadata for the agent.
   * @returns {Promise<boolean>} A promise that resolves to true if the update was successful.
   */
  async updateAgentMetadata(
    agentAddress: string,
    metadata: AgentMetadata
  ): Promise<boolean> {
    try {
      if (!this.ipfsSDK) {
        throw new Error("IPFS SDK is not initialized");
      }

      console.log(`updating agent ${agentAddress} with metadata: ${JSON.stringify(metadata)}`);
      
      // Upload new metadata to IPFS
      const uploadResponse = await this.ipfsSDK.upload.json(metadata);
      const agentURI = `ipfs://${uploadResponse.IpfsHash}`;

      // Update agent data on the blockchain
      const tx = await this.agentRegistry.setAgentData(
        agentAddress,
        metadata.name,
        agentURI
      );

      console.log(`transaction to update agent metadata was sent. tx: ${tx.hash}`);
      
      await tx.wait();

      return true;
    } catch (error: any) {
      console.error("Error updating agent metadata:", error);
      if (error.reason === "Agent not registered") {
        throw new Error("Agent not registered");
      } else if (error.reason === "Not the owner of the agent") {
        throw new Error("Not the owner of the agent");
      } else {
        throw error;
      }
    }
  }

  /**
   * Gets all agents owned by a specific address.
   * @param {string} ownerAddress - The address of the owner.
   * @returns {Promise<AgentData[]>} A promise that resolves to an array of agent data.
   */
  async getAgentsByOwner(ownerAddress: string): Promise<AgentData[]> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    const query = gql`
      query GetAgentsByOwner($owner: String!) {
        agents(where: { owner: $owner }) {
          id
          name
          agentUri
          owner
          reputation
          metadata {
            name
            description
            imageUri
          }
          proposals {
            id
            service
            price
          }
        }
      }
    `;

    try {
      const result = await this.subgraphClient.request<GetAgentsByOwnerQuery>(query, {
        owner: ownerAddress.toLowerCase()
      });

      return result.agents.map(agent => ({
        name: agent.name,
        agentUri: agent.agentUri,
        owner: agent.owner,
        agent: agent.id,
        reputation: BigInt(agent.reputation),
        totalRatings: BigInt(0) // Note: totalRatings would need to be added to subgraph schema
      }));
    } catch (error) {
      console.error("Error fetching agents by owner:", error);
      throw new Error(`Failed to fetch agents for owner ${ownerAddress}: ${error}`);
    }
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
