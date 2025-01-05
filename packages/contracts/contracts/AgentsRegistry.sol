// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentsRegistry is Ownable {
    struct Skill {
        string name;
        uint256 level;
    }

    struct AgentData {
        string model;
        string prompt;
        Skill[] skills;
        uint256 reputation;
        bool isRegistered;
    }

    struct Service {
        string name;
        string description;
    }

    mapping(address => AgentData) public agents;
    mapping(address => uint256[]) private agentToServices; // Maps agent to multiple service IDs
    mapping(uint256 => address[]) private serviceToAgents; // Maps service ID to multiple agents
    mapping(uint256 => Service) public services; // Stores metadata about services
    uint256 public nextServiceId; // Auto-incremented service ID

    constructor() Ownable(msg.sender) {}

    event AgentRegistered(address indexed agent, string model, uint256[] serviceIds);
    event ReputationUpdated(address indexed agent, uint256 newReputation);
    event ServiceCreated(uint256 indexed serviceId, string name);
    event AgentAddedToService(address indexed agent, uint256 serviceId);

    function createService(string memory name, string memory description) external onlyOwner returns (uint256) {
        uint256 serviceId = nextServiceId++;
        services[serviceId] = Service({ name: name, description: description });
        emit ServiceCreated(serviceId, name);
        return serviceId;
    }

    function getServiceData(uint256 serviceId) external view returns (string memory, string memory) {
        require(serviceId < nextServiceId, "Invalid service ID");
        Service storage service = services[serviceId];
        return (service.name, service.description);
    }

    function registerAgent(
        string memory model,
        string memory prompt,
        string[] memory skillNames,
        uint256[] memory serviceIds
    ) external returns (address) {
        require(!agents[msg.sender].isRegistered, "Agent already registered");

        Skill[] memory skills = new Skill[](skillNames.length);
        for (uint i = 0; i < skillNames.length; i++) {
            skills[i] = Skill({ name: skillNames[i], level: 0 });
        }

        agents[msg.sender] = AgentData({
            model: model,
            prompt: prompt,
            skills: skills,
            reputation: 100,
            isRegistered: true
        });

        for (uint i = 0; i < serviceIds.length; i++) {
            require(serviceIds[i] < nextServiceId, "Invalid service ID");
            agentToServices[msg.sender].push(serviceIds[i]);
            serviceToAgents[serviceIds[i]].push(msg.sender);
        }

        emit AgentRegistered(msg.sender, model, serviceIds);
        return msg.sender;
    }

    function addAgentToService(uint256 serviceId) external {
        require(agents[msg.sender].isRegistered, "Agent not registered");
        require(serviceId < nextServiceId, "Invalid service ID");

        uint256[] storage servicesList = agentToServices[msg.sender];
        for (uint i = 0; i < servicesList.length; i++) {
            require(servicesList[i] != serviceId, "Agent already in this service");
        }

        agentToServices[msg.sender].push(serviceId);
        serviceToAgents[serviceId].push(msg.sender);

        emit AgentAddedToService(msg.sender, serviceId);
    }

    function getAgentsByService(uint256 serviceId) external view returns (address[] memory) {
        require(serviceId < nextServiceId, "Invalid service ID");
        return serviceToAgents[serviceId];
    }

    function getServicesForAgent(address agent) external view returns (uint256[] memory) {
        require(agents[agent].isRegistered, "Agent not registered");
        return agentToServices[agent];
    }

    function updateReputation(address agent, uint256 _reputation) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        agents[agent].reputation = _reputation;
        emit ReputationUpdated(agent, _reputation);
    }

    function getSkills(address agent) external view returns (Skill[] memory) {
        require(agents[agent].isRegistered, "Agent not registered");
        return agents[agent].skills;
    }

    function getReputation(address agent) external view returns (uint256) {
        require(agents[agent].isRegistered, "Agent not registered");
        return agents[agent].reputation;
    }

    function getAgentData(address agent) external view returns (
        string memory model,
        string memory prompt,
        Skill[] memory skills,
        uint256 reputation
    ) {
        require(agents[agent].isRegistered, "Agent not registered");
        AgentData storage data = agents[agent];
        return (data.model, data.prompt, data.skills, data.reputation);
    }
}
