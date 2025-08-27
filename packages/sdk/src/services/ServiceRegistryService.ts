import { ethers } from "ethers";
import { 
  Service, 
  RegisterServiceParams, 
  UpdateService,
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
  validateUpdateService,
  validateService,
  parseRegisterServiceParams,
  parseUpdateService
} from "../schemas/service.schemas";
import { ServiceRegistry } from "../../typechain";

export class ServiceRegistryService {
  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private signer?: ethers.Signer
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
  async registerService(params: RegisterServiceParams): Promise<Service> {
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

      // Register service on blockchain - this will return a service ID
      const tx = await this.serviceRegistry.registerService(
        parsedParams.name,
        parsedParams.category,
        parsedParams.description
      );
      
      const receipt = await tx.wait();
      
      // Extract service ID from blockchain transaction
      const serviceId = this.extractServiceIdFromReceipt(receipt);
      
      console.log(`Service registered successfully: ${parsedParams.name} (ID: ${serviceId}, tx: ${receipt?.hash})`);
      
      // Create complete service object with blockchain-generated ID
      const service: Service = {
        ...parsedParams,
        id: serviceId,
        owner: ownerAddress,
        agentAddress: parsedParams.agentAddress || ethers.ZeroAddress,
        status: 'draft' as ServiceStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Validate complete service
      const serviceValidation = validateService(service);
      if (!serviceValidation.success) {
        throw new ServiceValidationError(
          "Service validation failed after blockchain registration",
          serviceValidation.error.issues
        );
      }

      return service;
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
   * @param {UpdateService} updates - Fields to update
   * @returns {Promise<Service>} The updated service
   * @throws {ServiceNotFoundError} If service doesn't exist
   * @throws {ServiceOwnershipError} If caller doesn't own the service
   * @throws {ServiceValidationError} If validation fails
   */
  async updateService(serviceId: string, updates: UpdateService): Promise<Service> {
    this.requireSigner();
    
    // Validate update parameters
    const validationResult = validateUpdateService({ ...updates, id: serviceId });
    if (!validationResult.success) {
      throw new ServiceValidationError(
        "Invalid service update parameters", 
        validationResult.error.issues
      );
    }
    
    const parsedUpdates = parseUpdateService({ ...updates, id: serviceId });
    
    try {
      // Get current service
      const currentService = await this.getServiceById(serviceId);
      
      // Check ownership
      await this.verifyServiceOwnership(currentService, await this.signer!.getAddress());
      
      // Merge updates with current service
      const updatedService: Service = {
        ...currentService,
        ...parsedUpdates,
        id: serviceId, // Ensure ID cannot be changed
        owner: currentService.owner, // Ensure owner cannot be changed here
        updatedAt: new Date().toISOString()
      };
      
      // Validate updated service
      const serviceValidation = validateService(updatedService);
      if (!serviceValidation.success) {
        throw new ServiceValidationError(
          "Updated service validation failed",
          serviceValidation.error.issues
        );
      }

      console.log(`Updating service: ${serviceId}`);

      // Update service on blockchain
      // Note: This will need to be updated when smart contract supports V2 operations
      const tx = await this.serviceRegistry.updateService(
        updatedService.name,
        updatedService.category,
        updatedService.description
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
      if (service.status === 'active') {
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
  async getServiceById(serviceId: string): Promise<Service> {
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
  } = {}): Promise<Service[]> {
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
  async transferServiceOwnership(serviceId: string, newOwner: string): Promise<Service> {
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
      const updatedService: Service = {
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
  async updateServiceStatus(serviceId: string, status: ServiceStatus): Promise<Service> {
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
      const updatedService: Service = {
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
   * Activates a service (changes status to 'active')
   * @param {string} serviceId - The service ID
   * @returns {Promise<Service>} The updated service
   */
  async activateService(serviceId: string): Promise<Service> {
    return this.updateServiceStatus(serviceId, 'active' as ServiceStatus);
  }

  /**
   * Deactivates a service (changes status to 'inactive')
   * @param {string} serviceId - The service ID  
   * @returns {Promise<Service>} The updated service
   */
  async deactivateService(serviceId: string): Promise<Service> {
    return this.updateServiceStatus(serviceId, 'inactive' as ServiceStatus);
  }

  /**
   * Archives a service (changes status to 'archived')
   * @param {string} serviceId - The service ID
   * @returns {Promise<Service>} The updated service
   */
  async archiveService(serviceId: string): Promise<Service> {
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
  async assignAgentToService(serviceId: string, agentAddress: string): Promise<Service> {
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

      // Update service with agent assignment
      const updatedService: Service = {
        ...service,
        agentAddress,
        updatedAt: new Date().toISOString()
      };

      // This will need smart contract support for agent assignments
      console.log(`Agent assigned to service: ${serviceId}`);
      
      return updatedService;
    } catch (error: any) {
      console.error(`Error assigning agent to service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Unassigns the current agent from a service
   * @param {string} serviceId - The service ID
   * @returns {Promise<Service>} The updated service
   */
  async unassignAgentFromService(serviceId: string): Promise<Service> {
    this.requireSigner();
    
    try {
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
      
      console.log(`Unassigning agent from service: ${service.agentAddress} <- ${serviceId}`);

      // Update service to remove agent assignment
      const updatedService: Service = {
        ...service,
        agentAddress: ethers.ZeroAddress,
        updatedAt: new Date().toISOString()
      };

      // This will need smart contract support for agent unassignment
      console.log(`Agent unassigned from service: ${serviceId}`);
      
      return updatedService;
    } catch (error: any) {
      console.error(`Error unassigning agent from service ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Gets all services assigned to a specific agent
   * @param {string} agentAddress - The agent's address
   * @returns {Promise<Service[]>} Array of services assigned to the agent
   */
  async getServicesByAgent(agentAddress: string): Promise<Service[]> {
    if (!ethers.isAddress(agentAddress)) {
      throw new ServiceValidationError(`Invalid agent address: ${agentAddress}`);
    }
    
    return this.listServices({ agentAddress });
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
  private async verifyServiceOwnership(service: Service, callerAddress: string): Promise<void> {
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
      'draft': ['active', 'deleted'],
      'active': ['inactive', 'archived', 'deleted'],
      'inactive': ['active', 'archived', 'deleted'],
      'archived': ['active', 'deleted'],  // Allow reactivation from archive
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
  async registerServiceLegacy(service: Service): Promise<boolean> {
    console.warn("registerServiceLegacy() is deprecated. Use registerService() with RegisterServiceParams instead.");
    
    try {
      // Convert Service to RegisterServiceParams format for compatibility
      const createParams: RegisterServiceParams = {
        name: service.name,
        description: service.description,
        category: service.category,
        owner: service.owner,
        agentAddress: service.agentAddress,
        endpointSchema: service.endpointSchema,
        method: service.method,
        parametersSchema: service.parametersSchema,
        resultSchema: service.resultSchema,
        pricing: service.pricing,
        tags: service.tags
      };
      
      await this.registerService(createParams);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Legacy method: Get service by name (V1 compatibility)
   * @deprecated Use getServiceById() instead
   */
  async getService(name: string): Promise<Service> {
    console.warn("getService() by name is deprecated. Use getServiceById() instead.");
    
    // This is a placeholder - in reality we'd need a name->ID mapping
    const contractResult = await this.serviceRegistry.getService(name);
    
    // Convert contract result to Service type (incomplete - needs proper mapping)
    const service: Service = {
      id: crypto.randomUUID(), // Placeholder - should come from contract
      name: contractResult.name,
      category: contractResult.category as any,
      description: contractResult.description,
      owner: ethers.ZeroAddress, // Placeholder - should come from contract
      agentAddress: ethers.ZeroAddress, // Placeholder - should come from contract
      endpointSchema: "", // Placeholder - should come from metadata
      method: "HTTP_POST" as any, // Placeholder - should come from metadata
      parametersSchema: {}, // Placeholder - should come from metadata
      resultSchema: {}, // Placeholder - should come from metadata
      status: "active" as any, // Placeholder - should come from contract
      pricing: undefined, // Placeholder - should come from metadata
      createdAt: new Date().toISOString(), // Placeholder
      updatedAt: new Date().toISOString() // Placeholder
    };
    
    return service;
  }
}
