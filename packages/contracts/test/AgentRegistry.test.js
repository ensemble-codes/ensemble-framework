const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
    let AgentRegistry;
    let registry;
    let admin, agentOwner, agentAddress;

    beforeEach(async function () {
        [admin, agentOwner, agentAddress] = await ethers.getSigners();
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
        serviceRegistry = await ServiceRegistry.deploy();
        AgentRegistry = await ethers.getContractFactory("AgentsRegistry");
        registry = await AgentRegistry.deploy(serviceRegistry.target);
    });

    it("Should not register an agent if the service is not registered", async function () {
        await expect(
            registry.connect(agentOwner).registerAgent(
                "Service Agent",
                "https://uri",
                agentAddress,
                "NonExistentService",
                ethers.parseEther("0.01")
            )
        ).to.be.revertedWith("Service not registered");
    });

    it("Should register new agent", async function () {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        const request = registry.connect(agentOwner).registerAgent(
            "Service Agent",
            "https://uri",
            agentAddress,
            "Service1",
            ethers.parseEther("0.01")
        );

        await expect(request)
            .to.emit(registry, "AgentRegistered")
            .withArgs(agentAddress, agentOwner, "Service Agent", "https://uri")
            .to.emit(registry, "ProposalAdded")
            .withArgs(agentAddress, 0, "Service1", ethers.parseEther("0.01"));
        
        const agentData = await registry.getAgentData(agentAddress);
        expect(agentData.name).to.equal("Service Agent");
        expect(agentData.agentUri).to.equal("https://uri");
        expect(agentData.owner).to.equal(agentOwner.address);
        expect(agentData.agent).to.equal(agentAddress);
        expect(agentData.reputation).to.equal(0);

        const proposal = await registry.getProposal(0);
        expect(proposal.issuer).to.equal(agentAddress);
        expect(proposal.serviceName).to.equal("Service1");
        expect(proposal.price).to.equal(ethers.parseEther("0.01"));
        expect(proposal.proposalId).to.equal(0);
    });

    it("Should not register the same agent twice", async function () {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        await registry.connect(agentOwner).registerAgent(
            "Service Agent",
            "https://uri",
            agentAddress,
            "Service1",
            ethers.parseEther("0.01")
        );

        await expect(
            registry.connect(agentOwner).registerAgent(
                "Service Agent",
                "https://uri",
                agentAddress,
                "Service1",
                ethers.parseEther("0.01")
            )
        ).to.be.revertedWith("Agent already registered");
    });

    
});
