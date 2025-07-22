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

interface GetAllAgentsQuery {
  agents: SubgraphAgent[];
}

export interface AgentFilters {
  category?: string;
  owner?: string;
  reputation_min?: number;
  reputation_max?: number;
  search?: string;
  first?: number;
  skip?: number;
}

export interface AgentFilterParams {
  owner?: string;
  name?: string;
  reputation_min?: number;
  reputation_max?: number;
  category?: string;
  first?: number;
  skip?: number;
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

    // Validate and normalize the Ethereum address
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(ownerAddress).toLowerCase();
    } catch (error) {
      throw new Error(`Invalid Ethereum address: ${ownerAddress}`);
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
      console.log('Getting agents by owner (normalized):', normalizedAddress);
      const result = await this.subgraphClient.request<GetAgentsByOwnerQuery>(query, {
        owner: normalizedAddress
      });

      console.log('Query result:', result);
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
   * Gets all agents from subgraph with optional filtering.
   * @param {AgentFilters} filters - Optional filters for agents.
   * @returns {Promise<AgentData[]>} A promise that resolves to an array of agent data.
   */
  async getAllAgents(filters: AgentFilters = {}): Promise<AgentData[]> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    // Build where clause based on filters
    const whereClause: string[] = [];
    if (filters.owner) {
      whereClause.push(`owner: "${filters.owner.toLowerCase()}"`);
    }
    if (filters.reputation_min !== undefined) {
      whereClause.push(`reputation_gte: "${(filters.reputation_min * 1e18).toString()}"`);
    }
    if (filters.reputation_max !== undefined) {
      whereClause.push(`reputation_lte: "${(filters.reputation_max * 1e18).toString()}"`);
    }
    if (filters.search) {
      whereClause.push(`name_contains_nocase: "${filters.search}"`);
    }

    const whereString = whereClause.length > 0 ? `where: { ${whereClause.join(', ')} }` : '';
    const firstString = filters.first ? `first: ${filters.first}` : 'first: 100';
    const skipString = filters.skip ? `skip: ${filters.skip}` : '';
    
    const queryParams = [whereString, firstString, skipString].filter(Boolean).join(', ');

    const query = gql`
      query GetAllAgents {
        agents(${queryParams}) {
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
      const result = await this.subgraphClient.request<GetAllAgentsQuery>(query, {});

      return result.agents.map(agent => ({
        name: agent.name,
        agentUri: agent.agentUri,
        owner: agent.owner,
        agent: agent.id,
        reputation: BigInt(agent.reputation),
        totalRatings: BigInt(0) // Note: totalRatings would need to be added to subgraph schema
      }));
    } catch (error) {
      console.error("Error fetching all agents:", error);
      throw new Error(`Failed to fetch agents: ${error}`);
    }
  }

  /**
   * Gets agents by category from subgraph.
   * @param {string} category - The category to filter by.
   * @param {number} first - Number of agents to fetch (default 100).
   * @param {number} skip - Number of agents to skip (default 0).
   * @returns {Promise<AgentData[]>} A promise that resolves to an array of agent data.
   */
  async getAgentsByCategory(category: string, first: number = 100, skip: number = 0): Promise<AgentData[]> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    const query = gql`
      query GetAgentsByCategory($category: String!, $first: Int!, $skip: Int!) {
        agents(
          first: $first
          skip: $skip
        ) {
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
      const result = await this.subgraphClient.request<GetAllAgentsQuery>(query, {
        category,
        first,
        skip
      });

      return result.agents.map(agent => ({
        name: agent.name,
        agentUri: agent.agentUri,
        owner: agent.owner,
        agent: agent.id,
        reputation: BigInt(agent.reputation),
        totalRatings: BigInt(0)
      }));
    } catch (error) {
      console.error("Error fetching agents by category:", error);
      throw new Error(`Failed to fetch agents for category ${category}: ${error}`);
    }
  }

  /**
   * Search agents by text query from subgraph.
   * @param {string} searchTerm - The search term.
   * @param {number} first - Number of agents to fetch (default 100).
   * @param {number} skip - Number of agents to skip (default 0).
   * @returns {Promise<AgentData[]>} A promise that resolves to an array of agent data.
   */
  async searchAgents(searchTerm: string, first: number = 100, skip: number = 0): Promise<AgentData[]> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    const query = gql`
      query SearchAgents($search: String!, $first: Int!, $skip: Int!) {
        agents(
          where: {
            or: [
              { name_contains_nocase: $search }
              { metadata_: { description_contains_nocase: $search } }
            ]
          }
          first: $first
          skip: $skip
          orderBy: reputation
          orderDirection: desc
        ) {
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
      const result = await this.subgraphClient.request<GetAllAgentsQuery>(query, {
        search: searchTerm,
        first,
        skip
      });

      return result.agents.map(agent => ({
        name: agent.name,
        agentUri: agent.agentUri,
        owner: agent.owner,
        agent: agent.id,
        reputation: BigInt(agent.reputation),
        totalRatings: BigInt(0)
      }));
    } catch (error) {
      console.error("Error searching agents:", error);
      throw new Error(`Failed to search agents with term "${searchTerm}": ${error}`);
    }
  }

  /**
   * Gets agent count from subgraph.
   * @returns {Promise<number>} A promise that resolves to the total number of agents.
   */
  async getAgentCount(): Promise<number> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    const query = gql`
      query GetAgentCount {
        agents(first: 1) {
          id
        }
        _meta {
          block {
            number
          }
        }
      }
    `;

    try {
      const result = await this.subgraphClient.request(query);
      // Note: This is a simplified approach. For accurate count, the subgraph would need to maintain a counter entity.
      // For now, we'll use a workaround by fetching all agents and counting them
      const allAgentsQuery = gql`
        query CountAllAgents {
          agents(first: 1000) {
            id
          }
        }
      `;
      
      const countResult = await this.subgraphClient.request<{agents: {id: string}[]}>(allAgentsQuery);
      return countResult.agents.length;
    } catch (error) {
      console.error("Error getting agent count:", error);
      throw new Error(`Failed to get agent count: ${error}`);
    }
  }

  /**
   * Gets agents with flexible filtering options.
   * @param {AgentFilterParams} filters - Filter parameters for agents.
   * @returns {Promise<AgentData[]>} A promise that resolves to an array of agent data.
   */
  async getAgentsByFilter(filters: AgentFilterParams = {}): Promise<AgentData[]> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    // Build where clause based on filters
    const whereClause: string[] = [];
    
    if (filters.owner) {
      // Validate and normalize the Ethereum address
      let normalizedOwner: string;
      try {
        normalizedOwner = ethers.getAddress(filters.owner).toLowerCase();
      } catch (error) {
        throw new Error(`Invalid Ethereum address for owner filter: ${filters.owner}`);
      }
      whereClause.push(`owner: "${normalizedOwner}"`);
    }
    
    if (filters.name) {
      whereClause.push(`name: "${filters.name}"`);
    }
    
    if (filters.reputation_min !== undefined) {
      whereClause.push(`reputation_gte: "${(filters.reputation_min * 1e18).toString()}"`);
    }
    
    if (filters.reputation_max !== undefined) {
      whereClause.push(`reputation_lte: "${(filters.reputation_max * 1e18).toString()}"`);
    }
    
    // Note: category filtering not available in current subgraph schema
    // if (filters.category) {
    //   whereClause.push(`metadata_: { category: "${filters.category}" }`);
    // }

    const whereString = whereClause.length > 0 ? `where: { ${whereClause.join(', ')} }` : '';
    const firstString = filters.first ? `first: ${filters.first}` : 'first: 100';
    const skipString = filters.skip ? `skip: ${filters.skip}` : '';
    
    const queryParams = [whereString, firstString, skipString].filter(Boolean).join(', ');

    const query = gql`
      query GetAgentsByFilter {
        agents(${queryParams}) {
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
      const result = await this.subgraphClient.request<GetAllAgentsQuery>(query, {});

      return result.agents.map(agent => ({
        name: agent.name,
        agentUri: agent.agentUri,
        owner: agent.owner,
        agent: agent.id,
        reputation: BigInt(agent.reputation),
        totalRatings: BigInt(0) // Note: totalRatings would need to be added to subgraph schema
      }));
    } catch (error) {
      console.error("Error fetching agents by filter:", error);
      throw new Error(`Failed to fetch agents with filters: ${error}`);
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
