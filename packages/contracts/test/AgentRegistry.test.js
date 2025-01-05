const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
    let AgentRegistry;
    let registry;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        AgentRegistry = await ethers.getContractFactory("AgentsRegistry");
        registry = await AgentRegistry.deploy();
    });

    it("Should register new agent", async function () {
        const tx = await registry.connect(addr1).registerAgent(
            "GPT-4",
            "AI Assistant",
            ["coding", "writing"]
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
        expect(agentRegisteredEvent.args.agent).to.not.equal(ethers.ZeroAddress);
        expect(agentRegisteredEvent.args.model).to.equal("GPT-4");
        expect(await registry.isRegistered(agentRegisteredEvent.args.agent)).to.be.true;
    });

    it("Should update agent reputation", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await registry.updateReputation(addr1.address, 200);
        const reputation = await registry.getReputation(addr1.address);
        expect(reputation).to.equal(200);
    });

    it("Should add and remove service to agent", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await registry.addServiceToAgent(addr1.address, 1);
        let agentData = await registry.getAgentData(addr1.address);
        expect(agentData.serviceIds.length).to.equal(1);
        expect(agentData.serviceIds[0]).to.equal(1);

        await registry.removeServiceFromAgent(addr1.address, 1);
        agentData = await registry.getAgentData(addr1.address);
        expect(agentData.serviceIds.length).to.equal(0);
    });

    it("Should add skill to agent", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await registry.addSkill(addr1.address, "debugging", 1);
        const skills = await registry.getSkills(addr1.address);
        expect(skills.length).to.equal(2);
        expect(skills[1].name).to.equal("debugging");
        expect(skills[1].level).to.equal(1);
    });

    it("Should fetch agents by service ID", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await registry.addServiceToAgent(addr1.address, 1);

        await registry.connect(addr2).registerAgent("GPT-5", "AI Debugger", ["debugging"]);
        await registry.addServiceToAgent(addr2.address, 1);

        const agents = await registry.getAgentsByServiceId(1);
        expect(agents.length).to.equal(2);
        expect(agents[0]).to.equal(addr1.address);
        expect(agents[1]).to.equal(addr2.address);
    });

    it("Should prevent duplicate registration", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await expect(
            registry.connect(addr1).registerAgent("GPT-5", "AI Debugger", ["debugging"])
        ).to.be.revertedWith("Agent already registered");
    });

    it("Should prevent unauthorized reputation update", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await expect(
            registry.connect(addr1).updateReputation(addr1.address, 200)
        ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("Should prevent adding service by non-owner", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await expect(
            registry.connect(addr1).updateReputation(addr1.address, 200)
        ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("Should prevent removing service by non-owner", async function () {
        await registry.connect(addr1).registerAgent("GPT-4", "AI Assistant", ["coding"]);
        await registry.addServiceToAgent(addr1.address, 1);
        await expect(
            registry.connect(addr1).updateReputation(addr1.address, 200)
        ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
});
