const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
    let AgentRegistry;
    let registry;
    let owner, addr1, agentAddress;

    beforeEach(async function () {
        [owner, addr1, agentAddress] = await ethers.getSigners();
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
        serviceRegistry = await ServiceRegistry.deploy();
        AgentRegistry = await ethers.getContractFactory("AgentsRegistry");
        registry = await AgentRegistry.deploy(serviceRegistry.target);
    });

    it("Should not register an agent if the service is not registered", async function () {
        await expect(
            registry.connect(addr1).registerAgent(
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
        const tx = await registry.connect(addr1).registerAgent(
            "Service Agent",
            "https://uri",
            agentAddress,
            "Service1",
            ethers.parseEther("0.01")
        );
        const receipt = await tx.wait();
        const events = receipt.logs.map(log => {
            try {
                return registry.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        const agentRegisteredEvent = events.find(event => event.name === "AgentRegistered");
        expect(agentRegisteredEvent).to.not.be.undefined;
        expect(agentRegisteredEvent.args.agent).to.equal(agentAddress);
        expect(agentRegisteredEvent.args.owner).to.equal(addr1.address);
        expect(agentRegisteredEvent.args.name).to.equal("Service Agent");
        expect(agentRegisteredEvent.args.agentUri).to.equal("https://uri");
    });

    // it("Should update agent reputation", async function () {
    //     await serviceRegistry.registerService("Service1", "Category1", "Description1");
    //     await registry.connect(addr1).registerAgent(
    //         "Service Agent",
    //         "https://uri",
    //         agentAddress,
    //         "Service1",
    //         ethers.parseEther("0.01")
    //     );

    //     await registry.updateReputation(addr1.address, 100);
    //     const reputation = await registry.getReputation(addr1.address);
    //     expect(reputation).to.equal(100);
    // });

    it("Should not update reputation for unregistered agent", async function () {
        await expect(
            registry.updateReputation(addr1.address, 100)
        ).to.be.revertedWith("Agent not registered");
    });

    it("Should fetch agent data", async function () {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        await registry.connect(addr1).registerAgent(
            "Service Agent",
            "https://uri",
            agentAddress,
            "Service1",
            ethers.parseEther("0.01")
        );

        const agentData = await registry.getAgentData(agentAddress);
        expect(agentData.name).to.equal("Service Agent");
        expect(agentData.agentUri).to.equal("https://uri");
        expect(agentData.owner).to.equal(addr1.address);
        expect(agentData.agent).to.equal(agentAddress);
        expect(agentData.reputation).to.equal(0);
    });


    it("Should not register the same agent twice", async function () {
        await serviceRegistry.registerService("Service1", "Category1", "Description1");
        await registry.connect(addr1).registerAgent(
            "Service Agent",
            "https://uri",
            agentAddress,
            "Service1",
            ethers.parseEther("0.01")
        );

        await expect(
            registry.connect(addr1).registerAgent(
                "Service Agent",
                "https://uri",
                agentAddress,
                "Service1",
                ethers.parseEther("0.01")
            )
        ).to.be.revertedWith("Agent already registered");
    });

    
});
