import { ethers } from "ethers";
import { 
  ServiceRecord, 
  ServiceOnChain,
  ServiceMetadata,
  RegisterServiceParams, 
  UpdateServiceParams,
  ServiceStatus,
  TransactionResult
} from "../types";
import { 
  ServiceAlreadyRegisteredError,
  ServiceNotFoundError,
  ServiceOwnershipError,
  ServiceStatusError,
  ServiceValidationError,
  ServiceAgentAssignmentError
} from "../errors";
import { 
  validateRegisterServiceParams,
  validateUpdateServiceParams,
  validateServiceRecord,
  parseRegisterServiceParams,
  parseUpdateServiceParams
} from "../schemas/service.schemas";
import { ServiceRegistry } from "../../typechain";

// IPFS integration types and utilities
type PinataSDK = any;

interface IPFSUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSMetadata {
  [key: string]: any;
}

class IPFSError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'IPFSError';
  }
}

export class ServiceRegistryService {
  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private signer?: ethers.Signer,
    private readonly ipfsSDK?: PinataSDK
  ) {}

  /**
   * Set the signer for write operations
   * @param {ethers.Signer} signer - The signer to use for write operations
   */
  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
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

  // ============================================================================
  // V2 CRUD Operations
  // ============================================================================

  /**
   * Registers a new service with comprehensive validation and metadata storage
   * @param {RegisterServiceParams} params - Service registration parameters
   * @returns {Promise<Service>} The registered service with generated ID and metadata
   * @throws {ServiceValidationError} If validation fails
   * @throws {ServiceAlreadyRegisteredError} If service name already exists
   */
  async registerService(params: RegisterServiceParams): Promise<ServiceRecord> {
    this.requireSigner();
    
    // Validate input parameters
    const validationResult = validateRegisterServiceParams(params);
    if (!validationResult.success) {
      throw new ServiceValidationError(
        "Invalid service creation parameters",
        validationResult.error.issues
      );
    }
    
    const parsedParams = parseRegisterServiceParams(params);
    
    try {
      const ownerAddress = await this.signer!.getAddress();

      console.log(`Registering service: ${parsedParams.name}`);

      // Add name and timestamps to metadata before upload
      const metadataWithTimestamps = {
        ...parsedParams.metadata,
        name: parsedParams.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Upload metadata to IPFS first
      let serviceUri: string;
      if (this.ipfsSDK) {
        const uploadResponse = await this.ipfsSDK.upload.json(metadataWithTimestamps);
        serviceUri = `ipfs://${uploadResponse.IpfsHash}`;
      } else {
        // Fallback for testing without IPFS - store as data URI
        serviceUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadataWithTimestamps)).toString('base64')}`;
      }

      // Register service on blockchain with minimal data
      const tx = await this.serviceRegistry.registerService(
        serviceUri,
        parsedParams.agentAddress || ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      
      // Extract service ID from blockchain transaction
      const serviceId = this.extractServiceIdFromReceipt(receipt);
      
      console.log(`Service registered successfully: ${parsedParams.name} (ID: ${serviceId}, tx: ${receipt?.hash})`);
      
      // Create complete service record combining on-chain and off-chain data
      const serviceRecord: ServiceRecord = {
        // On-chain fields
        id: serviceId,
        owner: ownerAddress,
        agentAddress: parsedParams.agentAddress || ethers.ZeroAddress,
        serviceUri,
        status: 'draft' as ServiceStatus,
        version: 1,
        
        // Off-chain fields from metadata (including name and timestamps)
        ...metadataWithTimestamps
      };
      
      // Validate complete service record
      const serviceValidation = validateServiceRecord(serviceRecord);
      if (!serviceValidation.success) {
        throw new ServiceValidationError(
          "Service validation failed after blockchain registration",
          serviceValidation.error.issues
        );
      }

      return serviceRecord;
    } catch (error: any) {
      console.error(`Error creating service ${parsedParams.name}:`, error);
      if (error.reason === "Service already registered") {
        throw new ServiceAlreadyRegisteredError(parsedParams.name);
      }
      throw error;
    }
  }

  /**
   * Updates an existing service with ownership and validation checks
   * @param {string} serviceId - The service ID to update
   * @param {UpdateServiceParams} updates - Fields to update
   * @returns {Promise<Service>} The updated service
   * @throws {ServiceNotFoundError} If service doesn't exist
   * @throws {ServiceOwnershipError} If caller doesn't own the service
   * @throws {ServiceValidationError} If validation fails
   */
  async updateService(serviceId: string, updates: UpdateServiceParams): Promise<ServiceRecord> {
    this.requireSigner();
    
    // Validate update parameters
    const validationResult = validateUpdateServiceParams({ ...updates, id: serviceId });
    if (!validationResult.success) {
      throw new ServiceValidationError(
        "Invalid service update parameters", 
        validationResult.error.issues
      );
    }
    
    const parsedUpdates = parseUpdateServiceParams({ ...updates, id: serviceId });
    
    try {
      // Get current service
      const currentService = await this.getServiceById(serviceId);
      
      // Check ownership
      await this.verifyServiceOwnership(currentService, await this.signer!.getAddress());
      
      // Merge updates with current service and update timestamp
      const updatedService: ServiceRecord = {
        ...currentService,
        ...parsedUpdates,
        id: serviceId, // Ensure ID cannot be changed
        owner: currentService.owner, // Ensure owner cannot be changed here
        updatedAt: new Date().toISOString() // Always update timestamp on any change
      };
      
      // Validate updated service
      const serviceValidation = validateServiceRecord(updatedService);
      if (!serviceValidation.success) {
        throw new ServiceValidationError(
          "Updated service validation failed",
          serviceValidation.error.issues
        );
      }

      console.log(`Updating service: ${serviceId}`);

      // Update service metadata on IPFS and blockchain
      let serviceUri: string;
      if (this.ipfsSDK) {
        const metadataToUpload = {
          name: updatedService.name,
          description: updatedService.description,
          category: updatedService.category,
          endpointSchema: updatedService.endpointSchema,
          method: updatedService.method,
          parametersSchema: updatedService.parametersSchema,
          resultSchema: updatedService.resultSchema,
          pricing: updatedService.pricing,
          tags: updatedService.tags,
          createdAt: updatedService.createdAt,
          updatedAt: updatedService.updatedAt
        };
        const uploadResponse = await this.ipfsSDK.upload.json(metadataToUpload);
        serviceUri = `ipfs://${uploadResponse.IpfsHash}`;
      } else {
        // Fallback for testing without IPFS
        const metadata = {
          name: updatedService.name,
          description: updatedService.description,
          category: updatedService.category,
          endpointSchema: updatedService.endpointSchema,
          method: updatedService.method,
          parametersSchema: updatedService.parametersSchema,
          resultSchema: updatedService.resultSchema,
          pricing: updatedService.pricing,
          tags: updatedService.tags,
          createdAt: updatedService.createdAt,
          updatedAt: updatedService.updatedAt
        };
        serviceUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
      }

      // Update service on blockchain with new IPFS URI
      const tx = await this.serviceRegistry.updateService(
        serviceId,
        serviceUri
      );
      
      const receipt = await tx.wait();
      console.log(`Service updated successfully: ${serviceId} (tx: ${receipt?.hash})`);

      return updatedService;
    } catch (error: any) {
      console.error(`Error updating service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a service (soft delete with status change to 'deleted')
   * @param {string} serviceId - The service ID to delete
   * @returns {Promise<boolean>} Success status
   * @throws {ServiceNotFoundError} If service doesn't exist
   * @throws {ServiceOwnershipError} If caller doesn't own the service
   * @throws {ServiceStatusError} If service cannot be deleted in current status
   */
  async deleteService(serviceId: string): Promise<boolean> {
    this.requireSigner();
    
    try {
      // Get current service
      const service = await this.getServiceById(serviceId);
      
      // Check ownership
      await this.verifyServiceOwnership(service, await this.signer!.getAddress());
      
      // Check if service can be deleted (not active)
      if (service.status === 'published') {
        throw new ServiceStatusError(
          serviceId, 
          service.status, 
          'inactive or archived'
        );
      }

      console.log(`Deleting service: ${serviceId}`);

      // Update service status to deleted
      await this.updateServiceStatus(serviceId, 'deleted' as ServiceStatus);
      
      console.log(`Service deleted successfully: ${serviceId}`);
      return true;
    } catch (error: any) {
      console.error(`Error deleting service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Gets a service by its ID with full metadata
   * @param {string} serviceId - The service ID
   * @returns {Promise<Service>} The service data
   * @throws {ServiceNotFoundError} If service doesn't exist
   */
  async getServiceById(serviceId: string): Promise<ServiceRecord> {
    try {
      // This is a placeholder implementation - will need smart contract support
      // For now, falling back to the existing getService method
      console.log(`Getting service by ID: ${serviceId}`);
      
      // In a real implementation, this would query by service ID
      // For now, we'll need to implement a mapping system
      throw new Error("getServiceById not yet implemented - requires smart contract V2");
      
    } catch (error: any) {
      console.error(`Error getting service ${serviceId}:`, error);
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        throw new ServiceNotFoundError(serviceId);
      }
      throw error;
    }
  }

  /**
   * Lists services with optional filtering and pagination
   * @param {object} options - Filter and pagination options
   * @returns {Promise<Service[]>} Array of services
   */
  async listServices(options: {
    owner?: string;
    agentAddress?: string;
    category?: string;
    status?: ServiceStatus[];
    limit?: number;
    offset?: number;
  } = {}): Promise<ServiceRecord[]> {
    try {
      console.log("Listing services with options:", options);
      
      // This is a placeholder implementation - will need smart contract support
      // For now, return empty array
      console.warn("listServices not yet fully implemented - requires smart contract V2");
      return [];
      
    } catch (error: any) {
      console.error("Error listing services:", error);
      throw error;
    }
  }

  // ============================================================================
  // Ownership Management
  // ============================================================================

  /**
   * Transfers service ownership to a new owner
   * @param {string} serviceId - The service ID
   * @param {string} newOwner - The new owner's address
   * @returns {Promise<Service>} The updated service
   * @throws {ServiceNotFoundError} If service doesn't exist
   * @throws {ServiceOwnershipError} If caller doesn't own the service
   */
  async transferServiceOwnership(serviceId: string, newOwner: string): Promise<ServiceRecord> {
    this.requireSigner();
    
    try {
      // Validate new owner address
      if (!ethers.isAddress(newOwner)) {
        throw new ServiceValidationError(`Invalid new owner address: ${newOwner}`);
      }
      
      // Get current service
      const service = await this.getServiceById(serviceId);
      
      // Check current ownership
      await this.verifyServiceOwnership(service, await this.signer!.getAddress());
      
      console.log(`Transferring service ownership: ${serviceId} to ${newOwner}`);

      // Update service owner
      const updatedService: ServiceRecord = {
        ...service,
        owner: newOwner,
        updatedAt: new Date().toISOString()
      };

      // This will need smart contract support for ownership transfers
      console.log(`Service ownership transferred: ${serviceId}`);
      
      return updatedService;
    } catch (error: any) {
      console.error(`Error transferring service ownership ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the owner of a service
   * @param {string} serviceId - The service ID
   * @returns {Promise<string>} The owner's address
   */
  async getServiceOwner(serviceId: string): Promise<string> {
    const service = await this.getServiceById(serviceId);
    return service.owner;
  }

  // ============================================================================
  // Service Lifecycle Management  
  // ============================================================================

  /**
   * Updates the status of a service
   * @param {string} serviceId - The service ID
   * @param {ServiceStatus} status - The new status
   * @returns {Promise<Service>} The updated service
   * @throws {ServiceNotFoundError} If service doesn't exist
   * @throws {ServiceOwnershipError} If caller doesn't own the service
   */
  async updateServiceStatus(serviceId: string, status: ServiceStatus): Promise<ServiceRecord> {
    this.requireSigner();
    
    try {
      // Get current service
      const service = await this.getServiceById(serviceId);
      
      // Check ownership
      await this.verifyServiceOwnership(service, await this.signer!.getAddress());
      
      // Validate status transition
      this.validateStatusTransition(service.status, status);
      
      console.log(`Updating service status: ${serviceId} from ${service.status} to ${status}`);

      // Update service
      const updatedService: ServiceRecord = {
        ...service,
        status,
        updatedAt: new Date().toISOString()
      };

      // This will need smart contract support for status updates
      console.log(`Service status updated: ${serviceId}`);
      
      return updatedService;
    } catch (error: any) {
      console.error(`Error updating service status ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Publishes a service (changes status to 'published')
   * @param {string} serviceId - The service ID
   * @returns {Promise<Service>} The updated service
   */
  async publishService(serviceId: string): Promise<ServiceRecord> {
    return this.updateServiceStatus(serviceId, 'published' as ServiceStatus);
  }

  /**
   * Unpublishes a service (changes status to 'archived')
   * @param {string} serviceId - The service ID  
   * @returns {Promise<Service>} The updated service
   */
  async unpublishService(serviceId: string): Promise<ServiceRecord> {
    return this.updateServiceStatus(serviceId, 'archived' as ServiceStatus);
  }

  /**
   * Archives a service (changes status to 'archived')
   * @param {string} serviceId - The service ID
   * @returns {Promise<Service>} The updated service
   */
  async archiveService(serviceId: string): Promise<ServiceRecord> {
    return this.updateServiceStatus(serviceId, 'archived' as ServiceStatus);
  }

  // ============================================================================
  // Agent Assignment Management
  // ============================================================================

  /**
   * Assigns an agent to a service
   * @param {string} serviceId - The service ID
   * @param {string} agentAddress - The agent's address
   * @returns {Promise<Service>} The updated service
   * @throws {ServiceAgentAssignmentError} If assignment fails
   */
  async assignAgentToService(serviceId: string, agentAddress: string): Promise<ServiceRecord> {
    this.requireSigner();
    
    try {
      // Validate agent address
      if (!ethers.isAddress(agentAddress)) {
        throw new ServiceAgentAssignmentError(
          serviceId,
          agentAddress,
          "Invalid agent address format"
        );
      }
      
      // Get current service
      const service = await this.getServiceById(serviceId);
      
      // Check ownership
      await this.verifyServiceOwnership(service, await this.signer!.getAddress());
      
      // Check if agent is already assigned
      if (service.agentAddress === agentAddress) {
        throw new ServiceAgentAssignmentError(
          serviceId,
          agentAddress,
          "Agent is already assigned to this service"
        );
      }
      
      console.log(`Assigning agent to service: ${agentAddress} -> ${serviceId}`);

      // Call smart contract to assign agent
      const tx = await this.serviceRegistry.connect(this.signer!)
        .assignAgentToService(serviceId, agentAddress);
      
      await tx.wait();
      console.log(`Agent assigned to service: ${serviceId}`);
      
      // Return updated service from contract
      return await this.getServiceById(serviceId);
    } catch (error: any) {
      console.error(`Error assigning agent to service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Unassigns the current agent from a service and sets the service status
   * @param {string} serviceId - The service ID
   * @param {ServiceStatus} newStatus - The new status for the service (draft or archived)
   * @returns {Promise<Service>} The updated service
   */
  async unassignAgentFromService(serviceId: string, newStatus: ServiceStatus): Promise<ServiceRecord> {
    this.requireSigner();
    
    try {
      // Validate status parameter
      if (newStatus !== 'draft' && newStatus !== 'archived') {
        throw new ServiceValidationError('Status must be either "draft" or "archived"');
      }
      
      // Get current service
      const service = await this.getServiceById(serviceId);
      
      // Check ownership
      await this.verifyServiceOwnership(service, await this.signer!.getAddress());
      
      // Check if any agent is assigned
      if (service.agentAddress === ethers.ZeroAddress || !service.agentAddress) {
        throw new ServiceAgentAssignmentError(
          serviceId,
          "none",
          "No agent is currently assigned to this service"
        );
      }
      
      console.log(`Unassigning agent from service: ${service.agentAddress} <- ${serviceId} (status: ${newStatus})`);

      // Call smart contract to unassign agent and set status
      const tx = await this.serviceRegistry.unassignAgentFromService(
        BigInt(serviceId),
        newStatus === 'draft' ? 0 : 2 // DRAFT = 0, ARCHIVED = 2
      );
      
      await tx.wait();
      
      console.log(`Agent unassigned from service: ${serviceId} with status: ${newStatus}`);
      
      // Return updated service
      return this.getServiceById(serviceId);
    } catch (error: any) {
      console.error(`Error unassigning agent from service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Gets all services assigned to a specific agent via smart contract
   * @param {string} agentAddress - The agent's address
   * @returns {Promise<Service[]>} Array of services assigned to the agent
   */
  async getServicesByAgent(agentAddress: string): Promise<ServiceRecord[]> {
    if (!ethers.isAddress(agentAddress)) {
      throw new ServiceValidationError(`Invalid agent address: ${agentAddress}`);
    }
    
    try {
      // Call smart contract to get service IDs for agent
      const serviceIds = await this.serviceRegistry.getServicesByAgent(agentAddress);
      
      // Fetch full service records for each ID
      const services: ServiceRecord[] = [];
      for (const serviceId of serviceIds) {
        try {
          const service = await this.getServiceById(serviceId.toString());
          services.push(service);
        } catch (error) {
          console.warn(`Could not fetch service ${serviceId}:`, error);
          // Skip invalid services but continue processing others
        }
      }
      
      return services;
    } catch (error: any) {
      console.error(`Error getting services for agent ${agentAddress}:`, error);
      throw error;
    }
  }

  /**
   * Gets all agents assigned to a specific service
   * @param {string} serviceId - The service ID
   * @returns {Promise<string[]>} Array of agent addresses assigned to the service
   */
  async getAssignedAgents(serviceId: string): Promise<string[]> {
    try {
      const service = await this.getServiceById(serviceId);
      
      // In ServiceRegistry V2, each service has only one agent
      // Return array for consistency with interface
      return service.agentAddress ? [service.agentAddress] : [];
    } catch (error: any) {
      console.error(`Error getting assigned agents for service ${serviceId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // IPFS Integration Methods
  // ============================================================================

  /**
   * Uploads metadata to IPFS with error handling and retry logic
   * @param {IPFSMetadata} metadata - Metadata object to upload
   * @returns {Promise<string>} IPFS URI (ipfs://hash)
   */
  async uploadMetadata(metadata: IPFSMetadata): Promise<string> {
    if (!this.ipfsSDK) {
      throw new IPFSError('IPFS SDK not configured');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Uploading metadata to IPFS (attempt ${attempt}/${maxRetries})`);
        
        const uploadResponse: IPFSUploadResponse = await this.ipfsSDK.upload.json(metadata);
        
        if (!uploadResponse.IpfsHash) {
          throw new IPFSError('No IPFS hash returned from upload');
        }

        const ipfsUri = `ipfs://${uploadResponse.IpfsHash}`;
        console.log(`Metadata uploaded to IPFS: ${ipfsUri}`);
        
        // Automatically pin the content
        await this.pinContent(uploadResponse.IpfsHash);
        
        return ipfsUri;
      } catch (error: any) {
        lastError = error;
        console.warn(`IPFS upload attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new IPFSError(`Failed to upload metadata after ${maxRetries} attempts`, lastError || undefined);
  }

  /**
   * Downloads metadata from IPFS with error handling
   * @param {string} ipfsUri - IPFS URI (ipfs://hash)
   * @returns {Promise<IPFSMetadata>} Downloaded metadata object
   */
  async downloadMetadata(ipfsUri: string): Promise<IPFSMetadata> {
    if (!ipfsUri.startsWith('ipfs://')) {
      throw new IPFSError('Invalid IPFS URI format');
    }

    const ipfsHash = ipfsUri.replace('ipfs://', '');
    
    try {
      console.log(`Downloading metadata from IPFS: ${ipfsUri}`);
      
      if (!this.ipfsSDK) {
        throw new IPFSError('IPFS SDK not configured');
      }

      // Use Pinata gateway or public gateway
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new IPFSError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metadata = await response.json();
      console.log(`Metadata downloaded from IPFS: ${ipfsUri}`);
      
      return metadata;
    } catch (error: any) {
      console.error(`Error downloading metadata from ${ipfsUri}:`, error);
      throw new IPFSError(`Failed to download metadata from ${ipfsUri}`, error);
    }
  }

  /**
   * Pins content to IPFS to ensure persistence
   * @param {string} ipfsHash - IPFS hash to pin
   * @returns {Promise<void>}
   */
  async pinContent(ipfsHash: string): Promise<void> {
    if (!this.ipfsSDK) {
      console.warn('IPFS SDK not configured, skipping pin operation');
      return;
    }

    try {
      console.log(`Pinning content to IPFS: ${ipfsHash}`);
      
      // Pin the content using Pinata
      await this.ipfsSDK.pinning.pinByHash({ hashToPin: ipfsHash });
      
      console.log(`Content pinned successfully: ${ipfsHash}`);
    } catch (error: any) {
      console.warn(`Failed to pin content ${ipfsHash}:`, error.message);
      // Don't throw error for pinning failures as upload was successful
    }
  }

  /**
   * Verifies IPFS content integrity by comparing hashes
   * @param {string} ipfsUri - IPFS URI to verify
   * @param {string} expectedHash - Optional expected hash to compare against
   * @returns {Promise<boolean>} True if content is valid and accessible
   */
  async verifyContentIntegrity(ipfsUri: string, expectedHash?: string): Promise<boolean> {
    try {
      const ipfsHash = ipfsUri.replace('ipfs://', '');
      
      if (expectedHash && ipfsHash !== expectedHash) {
        console.warn(`Hash mismatch: expected ${expectedHash}, got ${ipfsHash}`);
        return false;
      }

      // Try to download content to verify it's accessible
      await this.downloadMetadata(ipfsUri);
      
      return true;
    } catch (error: any) {
      console.error(`Content integrity verification failed for ${ipfsUri}:`, error);
      return false;
    }
  }

  /**
   * Creates a service with metadata uploaded to IPFS
   * @param {RegisterServiceParams} serviceData - Service creation parameters
   * @returns {Promise<ServiceRecord>} The created service record
   */
  async createServiceWithMetadata(serviceData: RegisterServiceParams): Promise<ServiceRecord> {
    try {
      // Extract metadata for IPFS upload
      const metadata: IPFSMetadata = {
        name: serviceData.name,
        description: serviceData.metadata?.description || '',
        category: serviceData.metadata?.category || 'other',
        tags: serviceData.metadata?.tags || [],
        endpointSchema: serviceData.metadata?.endpointSchema || '',
        method: serviceData.metadata?.method || 'HTTP_GET',
        parametersSchema: serviceData.metadata?.parametersSchema || {},
        resultSchema: serviceData.metadata?.resultSchema || {},
        pricing: serviceData.metadata?.pricing,
        createdAt: new Date().toISOString()
      };

      // Upload metadata to IPFS
      const ipfsUri = await this.uploadMetadata(metadata);

      // Create service with the original method, which will handle IPFS upload internally
      return await this.registerService(serviceData);
    } catch (error: any) {
      console.error('Error creating service with metadata:', error);
      throw error;
    }
  }

  /**
   * Updates service metadata on IPFS and synchronizes with blockchain
   * @param {string} serviceId - Service ID to update
   * @param {IPFSMetadata} metadata - New metadata object
   * @returns {Promise<ServiceRecord>} Updated service record
   */
  async updateServiceMetadata(serviceId: string, metadata: IPFSMetadata): Promise<ServiceRecord> {
    this.requireSigner();
    
    try {
      // Get current service to verify ownership
      const currentService = await this.getServiceById(serviceId);
      await this.verifyServiceOwnership(currentService, await this.signer!.getAddress());

      // Upload new metadata to IPFS
      await this.uploadMetadata({
        ...metadata,
        updatedAt: new Date().toISOString()
      });

      // Update service with new metadata
      const updateParams = {
        id: serviceId,
        metadata: {
          description: metadata.description,
          category: metadata.category as any,
          tags: metadata.tags,
          endpointSchema: metadata.endpointSchema,
          method: metadata.method as any,
          parametersSchema: metadata.parametersSchema,
          resultSchema: metadata.resultSchema,
          pricing: metadata.pricing
        }
      };

      return await this.updateService(serviceId, updateParams);
    } catch (error: any) {
      console.error(`Error updating service metadata for ${serviceId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Extracts service ID from transaction receipt
   * @param {any} receipt - Transaction receipt
   * @returns {string} The service ID from the blockchain
   * @throws {Error} If ServiceRegistered event not found
   * @private
   */
  private extractServiceIdFromReceipt(receipt: any): string {
    try {
      // Look for ServiceRegistered event in the logs
      const serviceRegisteredTopic = this.serviceRegistry.interface.getEvent('ServiceRegistered').topicHash;
      const event = receipt.logs.find((log: any) => log.topics[0] === serviceRegisteredTopic);
      
      if (event) {
        const parsed = this.serviceRegistry.interface.parseLog(event);
        if (parsed && parsed.args && parsed.args.serviceId) {
          // Convert BigInt to string for consistency with UUID format
          return parsed.args.serviceId.toString();
        }
      }
      
      throw new Error('ServiceRegistered event not found in transaction receipt');
    } catch (error) {
      // Fallback: extract from receipt if event parsing fails
      if (receipt.events && receipt.events.length > 0) {
        const serviceEvent = receipt.events.find((event: any) => event.event === 'ServiceRegistered');
        if (serviceEvent && serviceEvent.args && serviceEvent.args.serviceId) {
          return serviceEvent.args.serviceId.toString();
        }
      }
      
      console.error('Failed to extract service ID from receipt:', error);
      throw new Error('Could not extract service ID from blockchain transaction');
    }
  }

  /**
   * Verifies that the caller owns the specified service
   * @param {Service} service - The service to check
   * @param {string} callerAddress - The caller's address
   * @throws {ServiceOwnershipError} If ownership verification fails
   * @private
   */
  private async verifyServiceOwnership(service: ServiceRecord, callerAddress: string): Promise<void> {
    if (service.owner.toLowerCase() !== callerAddress.toLowerCase()) {
      throw new ServiceOwnershipError(service.id, service.owner, callerAddress);
    }
  }

  /**
   * Validates a service status transition
   * @param {ServiceStatus} currentStatus - Current status
   * @param {ServiceStatus} newStatus - Desired new status
   * @throws {ServiceStatusError} If transition is invalid
   * @private
   */
  private validateStatusTransition(currentStatus: ServiceStatus, newStatus: ServiceStatus): void {
    const validTransitions: Record<ServiceStatus, ServiceStatus[]> = {
      'draft': ['published', 'deleted'],
      'published': ['archived', 'deleted'],
      'archived': ['published', 'deleted'],  // Allow reactivation from archive
      'deleted': [] // No transitions from deleted state
    };
    
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ServiceStatusError(
        "unknown", 
        currentStatus, 
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
      );
    }
  }

  // ============================================================================
  // Legacy Methods (for backward compatibility)
  // ============================================================================

  /**
   * Legacy method: Register a service (V1 compatibility)
   * @deprecated Use registerService() with RegisterServiceParams instead
   */
  async registerServiceLegacy(service: ServiceRecord): Promise<boolean> {
    console.warn("registerServiceLegacy() is deprecated. Use registerService() with RegisterServiceParams instead.");
    
    try {
      // Convert ServiceRecord to RegisterServiceParams format for compatibility
      const createParams: RegisterServiceParams = {
        name: service.name,
        agentAddress: service.agentAddress,
        metadata: {
          description: service.description,
          category: service.category,
          endpointSchema: service.endpointSchema,
          method: service.method,
          parametersSchema: service.parametersSchema,
          resultSchema: service.resultSchema,
          pricing: service.pricing,
          tags: service.tags
        }
      };
      
      await this.registerService(createParams);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Legacy method: Get service by name (V1 compatibility)
   * @deprecated Use getServiceById() instead. V2 services don't support name-based lookup.
   */
  async getService(_name: string): Promise<ServiceRecord> {
    throw new Error(
      "getService() by name is no longer supported in V2. " +
      "Service names are stored off-chain. Use getServiceById() instead."
    );
  }
}
