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
    }

    function getAgentData(address _agent) external view returns (AgentDataV1 memory);

    function getProposal(uint256 _proposalId) external view returns (Proposal memory);

    function nextProposalId() external view returns (uint256);

    function serviceRegistry() external view returns (address);
}
