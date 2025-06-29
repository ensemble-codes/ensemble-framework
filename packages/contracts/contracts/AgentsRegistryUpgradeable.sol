// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ServiceRegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IProposalStruct.sol";
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
 * @notice A smart contract that stores information about the agents, and the services proposals provided by the agents.
 * @dev Upgradeable version using UUPS proxy pattern
 */
contract AgentsRegistryUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable, IProposalStruct {
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
    address public taskRegistry;

    mapping(address => AgentData) public agents;
    mapping(uint256 => ServiceProposal) public proposals;
    uint256 public nextProposalId;

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
        nextProposalId = 1;
    }

    event AgentRegistered(
        address indexed agent,
        address indexed owner,
        string name,
        string agentUri
    );
    event ReputationUpdated(address indexed agent, uint256 newReputation);

    event ProposalAdded(
        address indexed agent,
        uint256 proposalId,
        string name,
        uint256 price,
        address tokenAddress
    );
    event ProposalRemoved(address indexed agent, uint256 proposalId);

    event ProposalUpdated(
        address indexed agent,
        uint256 proposalId,
        uint256 price,
        address tokenAddress
    );
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
     * @dev Sets the address of the TaskRegistry contract.
     * @param _taskRegistry The address of the TaskRegistry contract.
     */
    function setTaskRegistry(address _taskRegistry) external onlyOwner {
        require(_taskRegistry != address(0), "Invalid address");
        taskRegistry = _taskRegistry;
    }

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
     * @dev Registers a new agent with the given details and the proposal.
     * @param name The name of the agent.
     * @param agentUri The URI pointing to the agent's metadata.
     * @param agent The address of the agent.
     * @param serviceName The name of the service.
     * @param servicePrice The price of the service.
     *
     * Requirements:
     *
     * - The agent must not already be registered.
     * - The caller will be set as the owner of the agent.
     *
     * Emits an {AgentRegistered} event.
     */
    function registerAgentWithService(
        address agent,
        string memory name,
        string memory agentUri,
        string memory serviceName,
        uint256 servicePrice,
        address tokenAddress
    ) external {
        require(agents[agent].agent == address(0), "Agent already registered");
        require(
            serviceRegistry.isServiceRegistered(serviceName),
            "Service not registered"
        );

        _createAgent(agent, name, agentUri, msg.sender, 0);

        _createProposal(agent, serviceName, servicePrice, tokenAddress);
    }

    /**
     * @dev Adds a new proposal for an agent.
     * @param agent The address of the agent.
     * @param serviceName The name of the service.
     * @param servicePrice The price of the service.
     *
     * Requirements:
     *
     * - The caller must be the owner of the agent.
     * - The agent must be registered.
     * - The service must be registered.
     *
     * Emits a {ProposalAdded} event.
     */
    function addProposal(
        address agent,
        string memory serviceName,
        uint256 servicePrice,
        address tokenAddress
    ) public onlyAgentOwner(agent) {
        require(
            serviceRegistry.isServiceRegistered(serviceName),
            "Service not registered"
        );

        _createProposal(agent, serviceName, servicePrice, tokenAddress);
    }

    /**
     * @dev Removes a proposal for an agent.
     * @param agent The address of the agent.
     * @param proposalId The ID of the proposal to remove.
     * @return true if the proposal was removed successfully, false otherwise.
     *
     * Requirements:
     *
     * - The caller must be the owner of the agent.
     * - The agent must be registered.
     * - The proposal must exist.
     *
     * Emits a {ProposalRemoved} event.
     */
    function removeProposal(
        address agent,
        uint256 proposalId
    ) external onlyAgentOwner(agent) returns (bool) {
        require(
            proposals[proposalId].issuer == agent,
            "ServiceProposal not found"
        );

        delete proposals[proposalId];

        emit ProposalRemoved(agent, proposalId);

        return true;
    }

    /**
     * @dev Migrates an agent.
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

        _migrateAgentProposals(agent);
    }

    function addRating(
        address agent,
        uint256 _rating
    ) public returns (uint256) {
        require(msg.sender == taskRegistry, "Not the TaskRegistry contract");
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

    function getProposal(
        uint256 proposalId
    ) external view returns (ServiceProposal memory) {
        return proposals[proposalId];
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
     * @dev Removes an existing agent and removes all associated proposals.
     * @param agent The address of the agent to remove.
     *
     * Requirements:
     *
     * - The caller must be the owner of the agent.
     * - The agent must be registered.
     *
     * Emits an {AgentRemoved} event and {ProposalRemoved} events for each removed proposal.
     */
    function removeAgent(address agent) external onlyAgentOwner(agent) {
        require(agents[agent].agent != address(0), "Agent not registered");
        
        address agentOwner = agents[agent].owner;
        
        // Remove all active proposals for this agent
        _removeAllAgentProposals(agent);
        
        // Clear agent data
        delete agents[agent];
        
        emit AgentRemoved(agent, agentOwner);
    }

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

    function _createProposal(
        address agent,
        string memory serviceName,
        uint256 servicePrice,
        address tokenAddress
    ) private {
        ServiceProposal memory newProposal = ServiceProposal(
            agent,
            serviceName,
            servicePrice,
            tokenAddress,
            nextProposalId,
            true
        );

        proposals[nextProposalId] = newProposal;

        emit ProposalAdded(agent, nextProposalId, serviceName, servicePrice, tokenAddress);

        nextProposalId++;
    }

    function _ensureServiceRegistered(string memory serviceName) private {
        if (!serviceRegistry.isServiceRegistered(serviceName)) {
            address serviceRegistryV1Addr = IAgentRegistryV1(agentRegistryV1)
                .serviceRegistry();

            IServiceRegistryV1 serviceRegistryV1 = IServiceRegistryV1(
                serviceRegistryV1Addr
            );

            IServiceRegistryV1.Service memory service = serviceRegistryV1
                .getService(serviceName);

            serviceRegistry.registerService(
                service.name,
                service.category,
                service.description
            );
        }
    }

    function _migrateAgentProposals(address agent) private {
        uint256 numProposalsRegistered = IAgentRegistryV1(agentRegistryV1)
            .nextProposalId();

        for (uint256 i = 0; i < numProposalsRegistered; i++) {
            IAgentRegistryV1.Proposal memory proposal = IAgentRegistryV1(
                agentRegistryV1
            ).getProposal(i);

            if (proposal.issuer != agent || !proposal.isActive) {
                continue;
            }

            _ensureServiceRegistered(proposal.serviceName);

            _createProposal(agent, proposal.serviceName, proposal.price, address(0));
        }
    }

    /**
     * @dev Internal function to remove all proposals associated with an agent.
     * @param agent The address of the agent whose proposals should be removed.
     */
    function _removeAllAgentProposals(address agent) private {
        // Iterate through all proposals to find and remove agent's proposals
        for (uint256 i = 1; i < nextProposalId; i++) {
            if (proposals[i].issuer == agent && proposals[i].isActive) {
                delete proposals[i];
                emit ProposalRemoved(agent, i);
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