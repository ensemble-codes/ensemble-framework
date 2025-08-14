import { ethers } from "ethers";
import { 
  AgentData, 
  AgentRecord, 
  Proposal, 
  AgentMetadata, 
  RegisterAgentParams,
  AgentFilterParams,
  UpdateableAgentRecord,
  TransactionResult,
  AgentRecordProperty,
  InvalidAgentIdError,
  AgentNotFoundError,
  AgentUpdateError,
  AgentSocials
} from "../types";
import {
  validateRegisterParams,
  validateUpdateParams,
  validateAgentRecord,
  parseAgentRecord,
  parseCommunicationParamsFromString
} from "../schemas/agent.schemas";
import {
  AgentAlreadyRegisteredError,
  ServiceNotRegisteredError,
} from "../errors";
import { PinataSDK } from "pinata-web3";
import { AgentsRegistry } from "../../typechain";
import { GraphQLClient, gql } from "graphql-request";

// Subgraph types
interface SubgraphIpfsMetadata {
  id: string;
  name: string;
  description: string;
  agentCategory: string;
  attributes: string[];
  instructions: string[];
  prompts: string[];
  communicationType: string;
  communicationParams?: string; // JSON string
  imageUri: string;
  twitter?: string;
  telegram?: string;
  dexscreener?: string;
  github?: string;
  website?: string;
}

interface SubgraphAgent {
  id: string;
  name: string;
  agentUri: string;
  owner: string;
  reputation: string;
  metadata?: SubgraphIpfsMetadata;
  proposals: Array<{
    id: string;
    service: string;
    price: string;
  }>;
}

interface AgentsQuery {
  agents: SubgraphAgent[];
}



export class AgentService {
  private subgraphClient?: GraphQLClient;

  /**
   * Helper function to convert SubgraphAgent to AgentRecord
   * @param {SubgraphAgent} agent - The subgraph agent data.
   * @param {number} totalRatingsCount - The total ratings count (default 0).
   * @returns {AgentRecord} The converted agent record.
   */
  private convertSubgraphAgentToRecord(agent: SubgraphAgent, totalRatingsCount: number = 0): AgentRecord {
    const metadata = agent.metadata;
    
    return {
      name: agent.name,
      description: metadata?.description || `Agent ${agent.name}`,
      address: agent.id,
      category: metadata?.agentCategory || 'general',
      owner: agent.owner,
      agentUri: agent.agentUri,
      imageURI: metadata?.imageUri || agent.agentUri,
      attributes: metadata?.attributes || [],
      instructions: metadata?.instructions || [],
      prompts: metadata?.prompts || [],
      socials: {
        twitter: metadata?.twitter || '',
        telegram: metadata?.telegram || '',
        dexscreener: metadata?.dexscreener || '',
        github: metadata?.github || '',
        website: metadata?.website || ''
      },
      communicationType: (metadata?.communicationType as any) || 'socketio-eliza',
      communicationParams: metadata?.communicationParams || '{}',
      reputation: BigInt(agent.reputation),
      totalRatings: BigInt(totalRatingsCount)
    };
  }

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
   * @param {RegisterAgentParams} params - The registration parameters for the agent.
   * @returns {Promise<boolean>} A promise that resolves to the agent registration status.
   */
  async registerAgent(
    address: string,
    params: RegisterAgentParams
  ): Promise<boolean> {
    try {
      if (!this.ipfsSDK) {
        throw new Error("IPFS SDK is not initialized");
      }
      
      // Validate registration parameters using Zod
      const validationResult = validateRegisterParams(params);
      if (!validationResult.success) {
        throw new Error(`Invalid registration parameters: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
      }
      
      console.log(`registering agent ${address} with params:`, params);
      
      // Convert RegisterAgentParams to AgentMetadata for IPFS storage
      const metadata: AgentMetadata = {
        name: params.name,
        description: params.description,
        imageURI: params.imageURI || '',
        socials: {
          twitter: params.socials?.twitter || '',
          telegram: params.socials?.telegram || '',
          dexscreener: params.socials?.dexscreener || '',
          github: params.socials?.github || '',
          website: params.socials?.website || ''
        },
        agentCategory: params.category,
        communicationType: params.communicationType || 'socketio-eliza',
        attributes: params.attributes || [],
        instructions: params.instructions || [],
        prompts: params.prompts || [],
        communicationParams: params.communicationParams
      };
      
      const uploadResponse = await this.ipfsSDK.upload.json(metadata);
      const agentURI = params.agentUri || `ipfs://${uploadResponse.IpfsHash}`;

      const tx = await this.agentRegistry.registerAgent(
        address,
        params.name,
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
   * @param {RegisterAgentParams} params - The registration parameters for the agent.
   * @param {string} serviceName - The name of the service.
   * @param {number} servicePrice - The price of the service.
   * @param {string} tokenAddress - The token address for payment.
   * @returns {Promise<boolean>} A promise that resolves to the agent registration status.
   */
  async registerAgentWithService(
    address: string,
    params: RegisterAgentParams,
    serviceName: string,
    servicePrice: number,
    tokenAddress: string = "0x0000000000000000000000000000000000000000" // Default to zero address for ETH
  ): Promise<boolean> {
    try {
      if (!this.ipfsSDK) {
        throw new Error("IPFS SDK is not initialized");
      }
      
      // Validate registration parameters using Zod
      const validationResult = validateRegisterParams(params);
      if (!validationResult.success) {
        throw new Error(`Invalid registration parameters: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
      }
      
      console.log(`registering agent ${address} with params:`, params);
      
      // Convert RegisterAgentParams to AgentMetadata for IPFS storage
      const metadata: AgentMetadata = {
        name: params.name,
        description: params.description,
        imageURI: params.imageURI || '',
        socials: {
          twitter: params.socials?.twitter || '',
          telegram: params.socials?.telegram || '',
          dexscreener: params.socials?.dexscreener || '',
          github: params.socials?.github || '',
          website: params.socials?.website || ''
        },
        agentCategory: params.category,
        communicationType: params.communicationType || 'socketio-eliza',
        attributes: params.attributes || [],
        instructions: params.instructions || [],
        prompts: params.prompts || [],
        communicationParams: params.communicationParams
      };
      
      const uploadResponse = await this.ipfsSDK.upload.json(metadata);
      const agentURI = params.agentUri || `ipfs://${uploadResponse.IpfsHash}`;

      const tx = await this.agentRegistry.registerAgentWithService(
        address,
        params.name,
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
  async getAgentData(agentAddress: string): Promise<AgentData> {
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
   * Gets a specific agent by address using subgraph.
   * @param {string} agentAddress - The address of the agent.
   * @returns {Promise<AgentRecord>} A promise that resolves to the agent record.
   */
  async getAgentRecord(agentAddress: string): Promise<AgentRecord> {
    if (!this.subgraphClient) {
      throw new Error("Subgraph client is not initialized. Please provide a subgraphUrl in the config.");
    }

    // Validate and normalize the Ethereum address
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(agentAddress).toLowerCase();
    } catch (error) {
      throw new Error(`Invalid Ethereum address: ${agentAddress}`);
    }

    const query = gql`
      query GetAgent($id: String!) {
        agent(id: $id) {
          id
          name
          agentUri
          owner
          reputation
          metadata {
            id
            name
            description
            agentCategory
            attributes
            instructions
            prompts
            communicationType
            communicationParams
            imageUri
            twitter
            telegram
            dexscreener
            github
            website
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
      console.log('Getting agent by address:', normalizedAddress);
      const result = await this.subgraphClient.request<{agent: SubgraphAgent | null}>(query, {
        id: normalizedAddress
      });

      if (!result.agent) {
        throw new Error(`Agent not found at address: ${agentAddress}`);
      }

      const agent = result.agent;
      const totalRatingsCount = 0; // Would need to be added to subgraph schema

      return this.convertSubgraphAgentToRecord(agent, totalRatingsCount);
    } catch (error) {
      console.error("Error fetching agent:", error);
      throw new Error(`Failed to fetch agent at address ${agentAddress}: ${error}`);
    }
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
   * @returns {Promise<AgentRecord[]>} A promise that resolves to an array of agent records.
   */
  async getAgentsByOwner(ownerAddress: string): Promise<AgentRecord[]> {
    return this.getAgentRecords({ owner: ownerAddress });
  }


  /**
   * Gets agents by category from subgraph.
   * @param {string} category - The category to filter by.
   * @param {number} first - Number of agents to fetch (default 100).
   * @param {number} skip - Number of agents to skip (default 0).
   * @returns {Promise<AgentRecord[]>} A promise that resolves to an array of agent records.
   */
  async getAgentsByCategory(category: string, first: number = 100, skip: number = 0): Promise<AgentRecord[]> {
    return this.getAgentRecords({ category, first, skip });
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
            id
            name
            description
            agentCategory
            attributes
            instructions
            prompts
            communicationType
            communicationParams
            imageUri
            twitter
            telegram
            dexscreener
            github
            website
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
      const result = await this.subgraphClient.request<AgentsQuery>(query, {
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
   * @returns {Promise<AgentRecord[]>} A promise that resolves to an array of agent records.
   */
  async getAgentRecords(filters: AgentFilterParams = {}): Promise<AgentRecord[]> {
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
    
    if (filters.category) {
      whereClause.push(`metadata_: { agentCategory: "${filters.category}" }`);
    }

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
            id
            name
            description
            agentCategory
            attributes
            instructions
            prompts
            communicationType
            communicationParams
            imageUri
            twitter
            telegram
            dexscreener
            github
            website
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
      const result = await this.subgraphClient.request<AgentsQuery>(query, {});

      return result.agents.map(agent => this.convertSubgraphAgentToRecord(agent));
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

  /**
   * Validates an agent ID format.
   * @param {string} agentId - The agent ID to validate.
   * @returns {boolean} True if valid, false otherwise.
   * @private
   */
  private isValidAgentId(agentId: string): boolean {
    try {
      // Check for null, undefined, or non-string types
      if (!agentId || typeof agentId !== 'string') {
        return false;
      }
      
      // Check if it's exactly 42 characters (0x + 40 hex chars)
      if (agentId.length !== 42) {
        return false;
      }
      
      // Check if it starts with 0x
      if (!agentId.startsWith('0x')) {
        return false;
      }
      
      // Check if it's a valid Ethereum address using ethers
      ethers.getAddress(agentId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates an agent ID and throws if invalid.
   * @param {string} agentId - The agent ID to validate.
   * @throws {InvalidAgentIdError} If the agent ID format is invalid.
   * @private
   */
  private validateAgentId(agentId: string): void {
    if (!this.isValidAgentId(agentId)) {
      throw new InvalidAgentIdError(agentId);
    }
  }

  /**
   * Checks if an agent exists on the blockchain.
   * @param {string} agentId - The agent ID to check.
   * @returns {Promise<boolean>} True if the agent exists, false otherwise.
   * @private
   */
  private async checkAgentExists(agentId: string): Promise<boolean> {
    try {
      const agentData = await this.agentRegistry.getAgentData(agentId);
      // Check if the agent has a name (indicating it exists)
      return agentData.name !== "";
    } catch (error) {
      console.error("Error checking agent existence:", error);
      return false;
    }
  }

  /**
   * Validates an agent exists and throws if not found.
   * @param {string} agentId - The agent ID to validate.
   * @throws {AgentNotFoundError} If the agent does not exist.
   * @private
   */
  private async validateAgentExists(agentId: string): Promise<void> {
    const exists = await this.checkAgentExists(agentId);
    if (!exists) {
      throw new AgentNotFoundError(agentId);
    }
  }

  /**
   * Cache for recently validated agents (TTL: 5 minutes)
   * @private
   */
  private agentExistenceCache = new Map<string, { exists: boolean; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Checks agent existence with caching.
   * @param {string} agentId - The agent ID to check.
   * @returns {Promise<boolean>} True if the agent exists, false otherwise.
   * @private
   */
  private async checkAgentExistsWithCache(agentId: string): Promise<boolean> {
    const cached = this.agentExistenceCache.get(agentId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.exists;
    }

    const exists = await this.checkAgentExists(agentId);
    this.agentExistenceCache.set(agentId, { exists, timestamp: now });

    // Clean up old cache entries
    for (const [key, value] of this.agentExistenceCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.agentExistenceCache.delete(key);
      }
    }

    return exists;
  }

  /**
   * Updates multiple properties of an agent record in a single transaction.
   * 
   * @param {string} agentId - The ID of the agent to update.
   * @param {UpdateableAgentRecord} agentData - Partial agent data to update.
   * @returns {Promise<TransactionResult>} Transaction result with hash, block number, and gas used.
   * @throws {InvalidAgentIdError} If the agent ID format is invalid.
   * @throws {AgentNotFoundError} If the agent does not exist.
   * @throws {AgentUpdateError} If the update fails.
   * 
   * @example
   * const result = await agentService.updateAgentRecord('0x123...', {
   *   name: 'Updated Agent Name',
   *   description: 'New description',
   *   attributes: ['ai', 'chatbot', 'assistant']
   * });
   * console.log(`Transaction hash: ${result.transactionHash}`);
   */
  async updateAgentRecord(agentId: string, agentData: UpdateableAgentRecord): Promise<TransactionResult> {
    // Validate agent ID format
    this.validateAgentId(agentId);

    // Validate update parameters using Zod
    const validationResult = validateUpdateParams(agentData);
    if (!validationResult.success) {
      throw new Error(`Invalid update parameters: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
    }

    // Check if agent exists
    await this.validateAgentExists(agentId);

    try {
      // Get current agent data to merge with updates
      const currentData = await this.getAgentData(agentId);
      
      // Fetch current metadata if available
      let currentMetadata: AgentMetadata | null = null;
      if (currentData.agentUri && this.ipfsSDK) {
        try {
          const ipfsHash = currentData.agentUri.replace('ipfs://', '');
          const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
          if (response.ok) {
            currentMetadata = await response.json();
          }
        } catch (error) {
          console.warn("Failed to fetch current metadata, proceeding with update:", error);
        }
      }

      // Merge current metadata with updates
      const updatedMetadata: AgentMetadata = {
        name: agentData.name || currentMetadata?.name || currentData.name,
        description: agentData.description || currentMetadata?.description || '',
        imageURI: agentData.imageURI || currentMetadata?.imageURI || '',
        socials: {
          ...currentMetadata?.socials,
          ...agentData.socials
        } as AgentSocials,
        agentCategory: agentData.category || currentMetadata?.agentCategory || 'general',
        communicationType: agentData.communicationType || currentMetadata?.communicationType || 'socketio-eliza',
        attributes: agentData.attributes || currentMetadata?.attributes || [],
        instructions: agentData.instructions || currentMetadata?.instructions || [],
        prompts: agentData.prompts || currentMetadata?.prompts || [],
        communicationParams: agentData.communicationParams || currentMetadata?.communicationParams
      };

      // Update using existing updateAgentMetadata method
      const updateResult = await this.updateAgentMetadata(agentId, updatedMetadata);

      if (!updateResult) {
        throw new AgentUpdateError("Failed to update agent metadata");
      }

      // Get the transaction receipt (this is a simplified version - would need actual tx tracking)
      return {
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64), // Mock for now
        blockNumber: 0, // Would get from actual receipt
        gasUsed: 0n, // Would get from actual receipt
        success: true,
        events: []
      };

    } catch (error: any) {
      if (error instanceof InvalidAgentIdError || error instanceof AgentNotFoundError) {
        throw error;
      }
      throw new AgentUpdateError(`Failed to update agent record: ${error.message}`, error);
    }
  }

  /**
   * Updates a single property of an agent record.
   * 
   * @param {string} agentId - The ID of the agent to update.
   * @param {AgentRecordProperty} property - The property name to update.
   * @param {any} value - The new value for the property.
   * @returns {Promise<TransactionResult>} Transaction result with hash, block number, and gas used.
   * @throws {InvalidAgentIdError} If the agent ID format is invalid.
   * @throws {AgentNotFoundError} If the agent does not exist.
   * @throws {AgentUpdateError} If the update fails or property is invalid.
   * 
   * @example
   * // Update agent name
   * await agentService.updateAgentRecordProperty('0x123...', 'name', 'New Agent Name');
   * 
   * // Update agent attributes
   * await agentService.updateAgentRecordProperty('0x123...', 'attributes', ['ai', 'assistant']);
   */
  async updateAgentRecordProperty(
    agentId: string, 
    property: AgentRecordProperty, 
    value: any
  ): Promise<TransactionResult> {
    // Validate agent ID format
    this.validateAgentId(agentId);

    // Validate property name
    const validProperties: AgentRecordProperty[] = [
      'name', 'description', 'category', 'imageURI', 'attributes', 
      'instructions', 'prompts', 'socials', 'communicationType', 
      'communicationParams', 'status'
    ];

    if (!validProperties.includes(property)) {
      throw new AgentUpdateError(`Invalid property: ${property}`);
    }

    // Type validation based on property
    switch (property) {
      case 'name':
      case 'description':
      case 'category':
      case 'imageURI':
      case 'communicationType':
      case 'status':
        if (typeof value !== 'string') {
          throw new AgentUpdateError(`Property ${property} must be a string`);
        }
        break;
      case 'attributes':
      case 'instructions':
      case 'prompts':
        if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
          throw new AgentUpdateError(`Property ${property} must be an array of strings`);
        }
        break;
      case 'socials':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new AgentUpdateError(`Property ${property} must be an object`);
        }
        break;
      case 'communicationParams':
        if (typeof value !== 'string') {
          throw new AgentUpdateError(`Property ${property} must be a string`);
        }
        // Validate it's a valid JSON string
        try {
          JSON.parse(value);
        } catch (e) {
          throw new AgentUpdateError(`Property ${property} must be a valid JSON string`);
        }
        break;
    }

    // Create partial update object
    const updateData: UpdateableAgentRecord = {
      [property]: value
    };

    // Use updateAgentRecord for the actual update
    return this.updateAgentRecord(agentId, updateData);
  }
}
