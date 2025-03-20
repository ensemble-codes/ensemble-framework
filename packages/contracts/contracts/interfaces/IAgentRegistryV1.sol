// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistryV1 {
    struct Proposal {
        address issuer;
        string serviceName;
        uint256 price;
        uint256 proposalId;
    }

    struct AgentDataV1 {
        string name;
        string agentUri;
        address owner;
        address agent;
        uint256 reputation;
        bool isRegistered;
        Proposal[] proposals;
    }

    function getAgentData(address _agent) external view returns (AgentDataV1 memory);
}
