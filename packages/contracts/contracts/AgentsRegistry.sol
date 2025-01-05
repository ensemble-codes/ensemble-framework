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

        agents[msg.sender] = AgentData({
            model: model,
            prompt: prompt,
            skills: skills,
            reputation: 100,
            isRegistered: true,
            serviceIds: new uint256[](0)
        });

        emit AgentRegistered(msg.sender, model);
        return msg.sender;
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

    function addSkill(address agent, string memory name, uint256 level) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        agents[agent].skills.push(Skill({
            name: name,
            level: level
        }));
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].isRegistered;
    }

    function getAgentData(address agent) external view returns (
        string memory model,
        string memory prompt,
        Skill[] memory skills,
        uint256 reputation,
        uint256[] memory serviceIds
    ) {
        require(agents[agent].isRegistered, "Agent not registered");
        AgentData storage data = agents[agent];
        return (data.model, data.prompt, data.skills, data.reputation, data.serviceIds);
    }

    /**
     * @dev Adds a service ID to an existing agent. Only owner can assign services.
     * @param agent The address of the agent.
     * @param serviceId The ID of the service.
     */
    function addServiceToAgent(address agent, uint256 serviceId) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        agents[agent].serviceIds.push(serviceId);
        serviceToAgents[serviceId].push(agent);
        emit ServiceAdded(agent, serviceId);
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
