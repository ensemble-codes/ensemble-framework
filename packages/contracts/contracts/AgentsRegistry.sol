// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ServiceRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IProposalStruct.sol";

contract AgentsRegistry is Ownable, IProposalStruct {

    struct AgentData {
        string name;
        string uri;
        address owner;
        address agent;
        uint256 reputation;
        bool isRegistered;
        Proposal[] proposals;
    }

    ServiceRegistry public serviceRegistry;
    mapping(address => AgentData) public agents;
    mapping(uint256 => address[]) private serviceToAgents;
    Proposal[] public proposals;
    uint256 public nextProposalId;

    modifier onlyRegistered(address agent) {
        require(agents[agent].isRegistered, "Agent not registered");
        _;
    }

    constructor(ServiceRegistry _serviceRegistry) Ownable(msg.sender) {
        serviceRegistry = _serviceRegistry;
    }

    event AgentRegistered(address indexed agent, address indexed owner, string name, string uri);
    event ReputationUpdated(address indexed agent, uint256 newReputation);
    event ServiceAdded(address indexed agent, uint256 serviceId);

    /**
     * @dev Registers a new agent with the given details.
     * @param name The name of the agent.
     * @param uri The URI pointing to the agent's metadata.
     * @param agent The address of the agent.
     * @param serviceName proposal.serviceName
     * @param servicePrice proposal.price
     * @return The address of the agent's owner.
     *
     * Requirements:
     *
     * - The agent must not already be registered.
     * - The caller will be set as the owner of the agent.
     *
     * Emits an {AgentRegistered} event.
     */
    function registerAgent(
        string memory name,
        string memory uri,
        address agent,
        string memory serviceName,
        uint256 servicePrice
    ) external returns (address) {
        require(!agents[msg.sender].isRegistered, "Agent already registered");

        AgentData storage agentData = agents[agent];
        agentData.name = name;
        agentData.uri = uri;
        agentData.owner = msg.sender;
        agentData.agent = address(this);
        agentData.reputation = 0;
        agentData.isRegistered = true;

        Proposal memory proposal = Proposal(agent, serviceName, servicePrice, nextProposalId);
        agentData.proposals.push(proposal);
        proposals.push(proposal);
        nextProposalId++;

        emit AgentRegistered(agent, msg.sender, name, uri);

        return msg.sender;
    }

    function updateReputation(address agent, uint256 _reputation) external onlyOwner onlyRegistered(agent) {
        agents[agent].reputation = _reputation;
        emit ReputationUpdated(agent, _reputation);
    }

    function getReputation(address agent) external view onlyRegistered(agent) returns (uint256) {
        return agents[agent].reputation;
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].isRegistered;
    }

    /**
     * @dev get agent data
     * @param _agent The address of the agent
     * @return name The name of the agent
     * @return uri The URI pointing to the agent's metadata
     * @return owner The owner address of the agent
     * @return agent The agent contract address
     * @return reputation The reputation score of the agent
     */
    function getAgentData(address _agent) external view onlyRegistered(agent) returns (
        string memory name,
        string memory uri,
        address owner,
        address agent,
        uint256 reputation
    ) {
        AgentData storage data = agents[_agent];
        return (data.name, data.uri, data.owner, data.agent, data.reputation);
    }

    /**
     * @dev Fetches all agents associated with a specific service ID.
     * @param serviceId The ID of the service.
     * @return List of agent addresses registered to the service.
     */
    function getAgentsByServiceId(uint256 serviceId) external view returns (address[] memory) {
        return serviceToAgents[serviceId];
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
}
