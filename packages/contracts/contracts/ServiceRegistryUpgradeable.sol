// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ServiceRegistryUpgradeable
 * @author leonprou
 * @notice A smart contract that manages service registration with hybrid on-chain/off-chain architecture.
 * @dev Upgradeable version using UUPS proxy pattern for Service Management V2
 */
contract ServiceRegistryUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    enum ServiceStatus {
        DRAFT,      // 0 - Newly created, not published
        PUBLISHED,  // 1 - Active and discoverable
        ARCHIVED,   // 2 - Inactive but preserved
        DELETED     // 3 - Soft deleted (hidden)
    }

    struct Service {
        uint256 id;              // Auto-incremented service ID
        address owner;           // Service owner address
        address agentAddress;    // Assigned agent (zero address if none)
        string serviceUri;       // IPFS URI for metadata (contains name & metadata)
        ServiceStatus status;    // Service lifecycle status
        uint256 version;         // Version for cache invalidation
    }

    // Storage mappings
    mapping(uint256 => Service) public services;           // serviceId => Service
    mapping(address => uint256[]) public servicesByOwner;  // owner => serviceId[]
    mapping(address => uint256[]) public servicesByAgent;  // agent => serviceId[]

    uint256 public nextServiceId;
    uint256 public totalServices;

    // Events
    event ServiceRegistered(uint256 indexed serviceId, address indexed owner, string serviceUri);
    event ServiceUpdated(uint256 indexed serviceId, string serviceUri, uint256 version);
    event ServiceStatusChanged(uint256 indexed serviceId, ServiceStatus indexed oldStatus, ServiceStatus indexed newStatus);
    event ServiceOwnershipTransferred(uint256 indexed serviceId, address indexed oldOwner, address indexed newOwner);
    event ServiceAgentAssigned(uint256 indexed serviceId, address indexed agent);
    event ServiceAgentUnassigned(uint256 indexed serviceId, address indexed agent);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     */
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        nextServiceId = 0;
        totalServices = 0;
    }

    // ============================================================================
    // Modifiers
    // ============================================================================
    
    modifier onlyServiceOwner(uint256 serviceId) {
        require(services[serviceId].owner == msg.sender, "Not service owner");
        _;
    }

    modifier serviceExists(uint256 serviceId) {
        require(serviceId > 0 && serviceId <= nextServiceId, "Service does not exist");
        _;
    }

    // ============================================================================
    // Core CRUD Operations
    // ============================================================================

    /**
     * @dev Registers a new service with hybrid on-chain/off-chain architecture.
     * @param serviceUri IPFS URI containing service metadata (including name).
     * @param agentAddress Optional agent address to assign (zero address if none).
     * @return serviceId The auto-incremented service ID.
     */
    function registerService(
        string memory serviceUri,
        address agentAddress
    ) external returns (uint256 serviceId) {
        require(bytes(serviceUri).length > 0, "Service URI required");
        
        serviceId = ++nextServiceId;
        
        services[serviceId] = Service({
            id: serviceId,
            owner: msg.sender,
            agentAddress: agentAddress,
            serviceUri: serviceUri,
            status: ServiceStatus.DRAFT,
            version: 1
        });
        
        servicesByOwner[msg.sender].push(serviceId);
        
        if (agentAddress != address(0)) {
            servicesByAgent[agentAddress].push(serviceId);
        }
        
        totalServices++;
        
        emit ServiceRegistered(serviceId, msg.sender, serviceUri);
        if (agentAddress != address(0)) {
            emit ServiceAgentAssigned(serviceId, agentAddress);
        }
    }

    /**
     * @dev Retrieves a service by its ID.
     * @param serviceId The ID of the service to retrieve.
     * @return The service details.
     */
    function getService(uint256 serviceId) external view serviceExists(serviceId) returns (Service memory) {
        return services[serviceId];
    }

    // V2: getServiceByName removed - names are stored off-chain in IPFS metadata

    /**
     * @dev Updates a service's metadata URI.
     * @param serviceId The ID of the service to update.
     * @param serviceUri The new IPFS URI for service metadata.
     */
    function updateService(uint256 serviceId, string memory serviceUri) 
        external 
        serviceExists(serviceId) 
        onlyServiceOwner(serviceId) 
    {
        require(bytes(serviceUri).length > 0, "Service URI required");
        
        Service storage service = services[serviceId];
        require(service.status != ServiceStatus.DELETED, "Cannot update deleted service");
        
        service.serviceUri = serviceUri;
        service.version++;
        
        emit ServiceUpdated(serviceId, serviceUri, service.version);
    }
    
    /**
     * @dev Sets the status of a service with validation.
     * @param serviceId The ID of the service.
     * @param newStatus The new status for the service.
     */
    function setServiceStatus(uint256 serviceId, ServiceStatus newStatus)
        external
        serviceExists(serviceId)
        onlyServiceOwner(serviceId)
    {
        Service storage service = services[serviceId];
        ServiceStatus oldStatus = service.status;
        
        // Validate status transitions
        if (newStatus == ServiceStatus.PUBLISHED) {
            require(service.agentAddress != address(0), "Service must have agent to be published");
            require(oldStatus == ServiceStatus.DRAFT || oldStatus == ServiceStatus.ARCHIVED, 
                    "Can only publish from DRAFT or ARCHIVED");
        } else if (newStatus == ServiceStatus.DELETED) {
            revert("Invalid status transition");
        } else if (newStatus == ServiceStatus.ARCHIVED) {
            require(oldStatus == ServiceStatus.PUBLISHED || oldStatus == ServiceStatus.DRAFT,
                    "Can only archive from PUBLISHED or DRAFT");
        }
        
        service.status = newStatus;
        service.version++;
        
        emit ServiceStatusChanged(serviceId, oldStatus, newStatus);
    }


    /**
     * @dev Soft deletes a service by setting its status to DELETED.
     * @param serviceId The ID of the service to delete.
     */
    function deleteService(uint256 serviceId) 
        external 
        serviceExists(serviceId) 
        onlyServiceOwner(serviceId) 
    {
        Service storage service = services[serviceId];
        require(service.status != ServiceStatus.DELETED, "Service already deleted");
        
        ServiceStatus oldStatus = service.status;
        service.status = ServiceStatus.DELETED;
        
        emit ServiceStatusChanged(serviceId, oldStatus, ServiceStatus.DELETED);
    }

    // ============================================================================
    // Ownership Management
    // ============================================================================

    /**
     * @dev Transfers service ownership to a new owner.
     * @param serviceId The ID of the service.
     * @param newOwner The new owner's address.
     */
    function transferServiceOwnership(uint256 serviceId, address newOwner) 
        external 
        serviceExists(serviceId) 
        onlyServiceOwner(serviceId) 
    {
        require(newOwner != address(0), "Invalid new owner");
        
        Service storage service = services[serviceId];
        address oldOwner = service.owner;
        
        service.owner = newOwner;
        
        // Update owner mappings
        _removeFromOwnerServices(oldOwner, serviceId);
        servicesByOwner[newOwner].push(serviceId);
        
        emit ServiceOwnershipTransferred(serviceId, oldOwner, newOwner);
    }

    /**
     * @dev Gets the owner of a service.
     * @param serviceId The ID of the service.
     * @return The owner's address.
     */
    function getServiceOwner(uint256 serviceId) external view serviceExists(serviceId) returns (address) {
        return services[serviceId].owner;
    }

    // ============================================================================
    // Agent Assignment Management
    // ============================================================================

    /**
     * @dev Assigns an agent to a service.
     * @param serviceId The ID of the service.
     * @param agent The agent's address.
     */
    function assignAgentToService(uint256 serviceId, address agent) 
        external 
        serviceExists(serviceId) 
        onlyServiceOwner(serviceId) 
    {
        require(agent != address(0), "Invalid agent address");
        
        Service storage service = services[serviceId];
        address oldAgent = service.agentAddress;
        
        if (oldAgent != address(0)) {
            _removeFromAgentServices(oldAgent, serviceId);
            emit ServiceAgentUnassigned(serviceId, oldAgent);
        }
        
        service.agentAddress = agent;
        servicesByAgent[agent].push(serviceId);
        
        emit ServiceAgentAssigned(serviceId, agent);
    }

    /**
     * @dev Unassigns the current agent from a service and sets the service status.
     * @param serviceId The ID of the service.
     * @param newStatus The new status for the service (DRAFT or ARCHIVED).
     */
    function unassignAgentFromService(uint256 serviceId, ServiceStatus newStatus) 
        external 
        serviceExists(serviceId) 
        onlyServiceOwner(serviceId) 
    {
        require(newStatus == ServiceStatus.DRAFT || newStatus == ServiceStatus.ARCHIVED, 
                "Status must be DRAFT or ARCHIVED");
        
        Service storage service = services[serviceId];
        address oldAgent = service.agentAddress;
        ServiceStatus oldStatus = service.status;
        
        require(oldAgent != address(0), "No agent assigned");
        
        service.agentAddress = address(0);
        service.status = newStatus;
        service.version++;
        
        _removeFromAgentServices(oldAgent, serviceId);
        
        emit ServiceAgentUnassigned(serviceId, oldAgent);
        emit ServiceStatusChanged(serviceId, oldStatus, newStatus);
    }

    // ============================================================================
    // Query Functions
    // ============================================================================

    /**
     * @dev Gets all services owned by an address.
     * @param owner The owner's address.
     * @return Array of service IDs owned by the address.
     */
    function getServicesByOwner(address owner) external view returns (uint256[] memory) {
        return servicesByOwner[owner];
    }

    /**
     * @dev Gets all services assigned to an agent.
     * @param agent The agent's address.
     * @return Array of service IDs assigned to the agent.
     */
    function getServicesByAgent(address agent) external view returns (uint256[] memory) {
        return servicesByAgent[agent];
    }

    /**
     * @dev Gets the total number of services.
     * @return The total service count.
     */
    function getTotalServiceCount() external view returns (uint256) {
        return totalServices;
    }

    // ============================================================================
    // Private Helper Functions
    // ============================================================================

    /**
     * @dev Validates a service status transition.
     * @param from Current status.
     * @param to Desired new status.
     * @return True if transition is valid.
     */
    function _isValidStatusTransition(ServiceStatus from, ServiceStatus to) internal pure returns (bool) {
        if (from == ServiceStatus.DRAFT) {
            return to == ServiceStatus.PUBLISHED || to == ServiceStatus.DELETED;
        } else if (from == ServiceStatus.PUBLISHED) {
            return to == ServiceStatus.ARCHIVED || to == ServiceStatus.DELETED;
        } else if (from == ServiceStatus.ARCHIVED) {
            return to == ServiceStatus.PUBLISHED || to == ServiceStatus.DELETED;
        }
        return false; // DELETED status is final
    }

    /**
     * @dev Removes a service ID from an owner's services array.
     * @param owner The owner's address.
     * @param serviceId The service ID to remove.
     */
    function _removeFromOwnerServices(address owner, uint256 serviceId) internal {
        uint256[] storage ownerServices = servicesByOwner[owner];
        for (uint256 i = 0; i < ownerServices.length; i++) {
            if (ownerServices[i] == serviceId) {
                ownerServices[i] = ownerServices[ownerServices.length - 1];
                ownerServices.pop();
                break;
            }
        }
    }

    /**
     * @dev Removes a service ID from an agent's services array.
     * @param agent The agent's address.
     * @param serviceId The service ID to remove.
     */
    function _removeFromAgentServices(address agent, uint256 serviceId) internal {
        uint256[] storage agentServices = servicesByAgent[agent];
        for (uint256 i = 0; i < agentServices.length; i++) {
            if (agentServices[i] == serviceId) {
                agentServices[i] = agentServices[agentServices.length - 1];
                agentServices.pop();
                break;
            }
        }
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[50] private __gap;
} 