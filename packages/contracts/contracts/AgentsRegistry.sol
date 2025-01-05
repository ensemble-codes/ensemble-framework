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
        uint256[] serviceIds;
    }


    mapping(address => AgentData) public agents;
    mapping(uint256 => address[]) private serviceToAgents;

    modifier onlyRegistered(address agent) {
        require(agents[agent].isRegistered, "Agent not registered");
        _;
    }

    constructor() Ownable(msg.sender) {}

    event AgentRegistered(address indexed agent, string model);
    event ReputationUpdated(address indexed agent, uint256 newReputation);
    event ServiceAdded(address indexed agent, uint256 serviceId);

    /**
     * @dev Registers a new agent with the given model, prompt, and skills.
     * @param model The model of the agent.
     * @param prompt The prompt for the agent.
     * @param skillNames The names of the skills the agent possesses.
     * @return The address of the registered agent.
     */
    function registerAgent(
        string memory model,
        string memory prompt,
        string[] memory skillNames
    ) external returns (address) {
        require(!agents[msg.sender].isRegistered, "Agent already registered");

        Skill[] memory skills = new Skill[](skillNames.length);
        for (uint i = 0; i < skillNames.length; i++) {
            skills[i] = Skill({
                name: skillNames[i],
                level: 0
            });
        }

        agents[msg.sender].model = model;
        agents[msg.sender].prompt = prompt;
        agents[msg.sender].reputation = 100;
        agents[msg.sender].isRegistered = true;
        agents[msg.sender].serviceIds = new uint256[](0);
        
        // Add skills one by one
        for (uint i = 0; i < skills.length; i++) {
            agents[msg.sender].skills.push(skills[i]);
        }

        emit AgentRegistered(msg.sender, model);
        return msg.sender;
    }

    function updateReputation(address agent, uint256 _reputation) external onlyOwner onlyRegistered(agent) {
        agents[agent].reputation = _reputation;
        emit ReputationUpdated(agent, _reputation);
    }

    function getSkills(address agent) external view onlyRegistered(agent) returns (Skill[] memory) {
        return agents[agent].skills;
    }

    function getReputation(address agent) external view onlyRegistered(agent) returns (uint256) {
        return agents[agent].reputation;
    }

    function addSkill(address agent, string memory name, uint256 level) external onlyOwner onlyRegistered(agent) {
        agents[agent].skills.push(Skill({
            name: name,
            level: level
        }));
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].isRegistered;
    }

    function getAgentData(address agent) external view onlyRegistered(agent) returns (
        string memory model,
        string memory prompt,
        Skill[] memory skills,
        uint256 reputation,
        uint256[] memory serviceIds
    ) {
        AgentData storage data = agents[agent];
        return (data.model, data.prompt, data.skills, data.reputation, data.serviceIds);
    }

    /**
     * @dev Adds a service ID to an existing agent. Only owner can assign services.
     * @param agent The address of the agent.
     * @param serviceId The ID of the service.
     */
    function addServiceToAgent(address agent, uint256 serviceId) external onlyOwner onlyRegistered(agent) {
        agents[agent].serviceIds.push(serviceId);
        serviceToAgents[serviceId].push(agent);
        emit ServiceAdded(agent, serviceId);
    }

    function removeServiceFromAgent(address agent, uint256 serviceId) external onlyOwner onlyRegistered(agent) {
        uint256[] storage services = agents[agent].serviceIds;
        bool found = false;

        for (uint i = 0; i < services.length; i++) {
            if (services[i] == serviceId) {
                services[i] = services[services.length - 1];
                services.pop();
                found = true;
                break;
            }
        }

        require(found, "Service not found for agent");

        address[] storage agentList = serviceToAgents[serviceId];
        for (uint i = 0; i < agentList.length; i++) {
            if (agentList[i] == agent) {
                agentList[i] = agentList[agentList.length - 1];
                agentList.pop();
                break;
            }
        }
    }

    /**
     * @dev Fetches all agents associated with a specific service ID.
     * @param serviceId The ID of the service.
     * @return List of agent addresses registered to the service.
     */
    function getAgentsByServiceId(uint256 serviceId) external view returns (address[] memory) {
        return serviceToAgents[serviceId];
    }
}
