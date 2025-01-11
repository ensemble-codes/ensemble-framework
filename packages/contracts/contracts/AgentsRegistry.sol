// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ServiceRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IProposalStruct.sol";


contract AgentsRegistry is Ownable, IProposalStruct {

    struct AgentData {
        string name;
        string agentUri;
        address owner;
        address agent;
        uint256 reputation;
        bool isRegistered;
        Proposal[] proposals;
    }

    ServiceRegistry public serviceRegistry;
    mapping(address => AgentData) public agents;
    Proposal[] public proposals;
    uint256 public nextProposalId;

    modifier onlyRegistered(address agent) {
        require(agents[agent].isRegistered, "Agent not registered");
        _;
    }

    constructor(ServiceRegistry _serviceRegistry) Ownable(msg.sender) {
        serviceRegistry = _serviceRegistry;
    }

    event AgentRegistered(address indexed agent, address indexed owner, string name, string agentUri);
    event ReputationUpdated(address indexed agent, uint256 newReputation);
    event ServiceAdded(address indexed agent, uint256 name);
    event ProposalAdded(address indexed agent, string name, uint256 price);
    
    /**
     * @dev Registers a new agent with the given details.
     * @param name The name of the agent.
     * @param agentUri The URI pointing to the agent's metadata.
     * @param agent The address of the agent.
     * @param serviceName The name of the service.
     * @param servicePrice The price of the service.
     * @return true if the agent was registered successfully, false otherwise.
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
        string memory agentUri,
        address agent,
        string memory serviceName,
        uint256 servicePrice
    ) external returns (bool) {
        require(!agents[agent].isRegistered, "Agent already registered");
        require(serviceRegistry.isServiceRegistered(serviceName), "Service not registered");

        AgentData storage agentData = agents[agent];
        agentData.name = name;
        agentData.agentUri = agentUri;
        agentData.owner = msg.sender;
        agentData.agent = agent;
        agentData.reputation = 0;
        agentData.isRegistered = true;
        Proposal memory proposal = Proposal(agent, serviceName, servicePrice, nextProposalId);
        agentData.proposals.push(proposal);
        proposals.push(proposal);
        // agentData.proposals = new Proposal[](1);
        // agentData.proposals[1] = proposal;
        
        // agentData.proposals = new Proposal[](1);
        // agentData.proposals[0] = Proposal(serviceName, servicePrice, nextProposalId);
        nextProposalId++;
        emit AgentRegistered(agent, msg.sender, name, agentUri);
        emit ProposalAdded(agent, serviceName, servicePrice);

        return true;
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
     * @return agentUri The URI pointing to the agent's metadata
     * @return owner The owner address of the agent
     * @return agent The agent contract address
     * @return reputation The reputation score of the agent
     */
    function getAgentData(address _agent) external view returns (
        string memory name,
        string memory agentUri,
        address owner,
        address agent,
        uint256 reputation
    ) {
        AgentData storage data = agents[_agent];
        return (data.name, data.agentUri, data.owner, data.agent, data.reputation);
    }


    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
}
