// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ServiceRegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IAgentRegistryV1.sol";

// Interface for V1 ServiceRegistry compatibility
interface IServiceRegistryV1 {
    struct Service {
        string name;
        string category;
        string description;
        bool isActive;
    }
    
    function getService(string memory serviceName) external view returns (Service memory);
}

/**
 * @title AgentsRegistryUpgradeable
 * @author leonprou
 * @notice A smart contract that manages agent registration and reputation.
 * @dev Upgradeable version using UUPS proxy pattern for Agent Management V2
 */
contract AgentsRegistryUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct AgentData {
        string name;
        string agentUri;
        address owner;
        address agent;
        uint256 reputation;
        uint256 totalRatings;
    }

    IAgentRegistryV1 public agentRegistryV1;
    ServiceRegistryUpgradeable public serviceRegistry;

    mapping(address => AgentData) public agents;

    modifier onlyAgentOwner(address agent) {
        require(
            agents[agent].owner == msg.sender,
            "Not the owner of the agent"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     * @param _agentRegistryV1 The address of the V1 agent registry for migration
     * @param _serviceRegistry The address of the service registry
     */
    function initialize(
        IAgentRegistryV1 _agentRegistryV1,
        ServiceRegistryUpgradeable _serviceRegistry
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        agentRegistryV1 = _agentRegistryV1;
        serviceRegistry = _serviceRegistry;
    }

    event AgentRegistered(
        address indexed agent,
        address indexed owner,
        string name,
        string agentUri
    );
    event ReputationUpdated(address indexed agent, uint256 newReputation);
    event AgentDataUpdated(
        address indexed agent,
        string name,
        string agentUri
    );
    event AgentRemoved(
        address indexed agent,
        address indexed owner
    );


    /**
     * @dev Sets the address of the ServiceRegistry contract.
     * @param _serviceRegistry The address of the ServiceRegistry contract.
     */
    function setServiceRegistry(address _serviceRegistry) external onlyOwner {
        require(_serviceRegistry != address(0), "Invalid address");
        serviceRegistry = ServiceRegistryUpgradeable(_serviceRegistry);
    }

    /**
     * @dev Registers a new agent with the given details.
     * @param name The name of the agent.
     * @param agentUri The URI pointing to the agent's metadata.
     * @param agent The address of the agent.
     *
     * Requirements:
     *
     * - The agent must not already be registered.
     * - The caller will be set as the owner of the agent.
     *
     * Emits an {AgentRegistered} event.
     */
    function registerAgent(
        address agent,
        string memory name,
        string memory agentUri
    ) external {
        require(agents[agent].agent == address(0), "Agent already registered");

        _createAgent(agent, name, agentUri, msg.sender, 0);
    }

    /**
     * @dev Migrates an agent from V1 registry.
     * @param agent The address of the agent.
     */
    function migrateAgent(address agent) external {
        require(agents[agent].agent == address(0), "Agent already registered");

        IAgentRegistryV1.AgentData memory v1AgentData = IAgentRegistryV1(agentRegistryV1).getAgentData(agent);

        require(
            msg.sender == v1AgentData.owner || msg.sender == owner(),
            "Not owner or agent owner"
        );

        _createAgent(agent, v1AgentData.name, v1AgentData.agentUri, v1AgentData.owner, v1AgentData.reputation);
    }

    /**
     * @dev Adds a rating to an agent (for external integration).
     * @param agent The address of the agent.
     * @param _rating The rating value (0-100).
     * @return The new reputation score.
     */
    function addRating(
        address agent,
        uint256 _rating
    ) public returns (uint256) {
        require(
            _rating >= 0 && _rating <= 100,
            "Rating must be between 0 and 100"
        );
        agents[agent].totalRatings += 1;
        agents[agent].reputation =
            (agents[agent].reputation *
                (agents[agent].totalRatings - 1) +
                _rating) /
            agents[agent].totalRatings;
        emit ReputationUpdated(agent, agents[agent].reputation);

        return agents[agent].reputation;
    }

    /**
     * @dev Gets the reputation of an agent.
     * @param agent The address of the agent.
     * @return The reputation score.
     */
    function getReputation(address agent) external view returns (uint256) {
        return agents[agent].reputation;
    }

    /**
     * @dev Returns the data of an agent.
     * @param _agent The address of the agent.
     * @return AgentData The data of the agent.
     */
    function getAgentData(
        address _agent
    ) external view returns (AgentData memory) {
        AgentData storage data = agents[_agent];
        return data;
    }

    /**
     * @dev Sets the data of an existing agent.
     * @param agent The address of the agent to update.
     * @param name The new name of the agent.
     * @param agentUri The new URI pointing to the agent's metadata.
     *
     * Requirements:
     *
     * - The caller must be the owner of the agent.
     * - The agent must be registered.
     *
     * Emits an {AgentDataUpdated} event.
     */
    function setAgentData(
        address agent,
        string memory name,
        string memory agentUri
    ) external onlyAgentOwner(agent) {
        require(agents[agent].agent != address(0), "Agent not registered");
        
        agents[agent].name = name;
        agents[agent].agentUri = agentUri;
        
        emit AgentDataUpdated(agent, name, agentUri);
    }

    /**
     * @dev Removes an existing agent.
     * @param agent The address of the agent to remove.
     *
     * Requirements:
     *
     * - The caller must be the owner of the agent.
     * - The agent must be registered.
     *
     * Emits an {AgentRemoved} event.
     */
    function removeAgent(address agent) external onlyAgentOwner(agent) {
        require(agents[agent].agent != address(0), "Agent not registered");
        
        address agentOwner = agents[agent].owner;
        
        // Clear agent data
        delete agents[agent];
        
        emit AgentRemoved(agent, agentOwner);
    }

    /**
     * @dev Internal function to create an agent.
     */
    function _createAgent(
        address agent,
        string memory name,
        string memory agentUri,
        address owner,
        uint256 reputation
    ) private {
        AgentData storage agentData = agents[agent];
        agentData.name = name;
        agentData.agentUri = agentUri;
        agentData.owner = owner;
        agentData.agent = agent;
        agentData.reputation = reputation;

        emit AgentRegistered(agent, owner, name, agentUri);
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