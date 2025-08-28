const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("AgentsRegistryUpgradeable V2 - Without Proposals", function () {
    let AgentsRegistry;
    let ServiceRegistry;
    let agentsRegistry;
    let serviceRegistry;
    let mockV1Registry;
    let owner, addr1, addr2, agentAddr1, agentAddr2;

    // Test data constants
    const AGENT_NAME_1 = "Test Agent 1";
    const AGENT_NAME_2 = "Test Agent 2";
    const AGENT_URI_1 = "ipfs://QmAgent1Hash/metadata.json";
    const AGENT_URI_2 = "ipfs://QmAgent2Hash/metadata.json";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, addr1, addr2, agentAddr1, agentAddr2] = await ethers.getSigners();
        
        // Deploy ServiceRegistry first (dependency)
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistryUpgradeable");
        serviceRegistry = await upgrades.deployProxy(ServiceRegistry, [], {
            initializer: "initialize",
            kind: "uups"
        });
        await serviceRegistry.waitForDeployment();

        // Deploy mock V1 registry for migration compatibility
        mockV1Registry = await upgrades.deployProxy(ServiceRegistry, [], {
            initializer: "initialize",
            kind: "uups"
        });
        await mockV1Registry.waitForDeployment();

        // Deploy AgentsRegistry
        AgentsRegistry = await ethers.getContractFactory("AgentsRegistryUpgradeable");
        agentsRegistry = await upgrades.deployProxy(
            AgentsRegistry, 
            [await mockV1Registry.getAddress(), await serviceRegistry.getAddress()],
            {
                initializer: "initialize",
                kind: "uups"
            }
        );
        await agentsRegistry.waitForDeployment();
    });

    describe("1. Contract Initialization & Deployment", function () {
        it("Should initialize with correct initial state", async function () {
            expect(await agentsRegistry.owner()).to.equal(owner.address);
            expect(await agentsRegistry.agentRegistryV1()).to.equal(await mockV1Registry.getAddress());
            expect(await agentsRegistry.serviceRegistry()).to.equal(await serviceRegistry.getAddress());
        });

        it("Should be deployed as UUPS proxy", async function () {
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(
                await agentsRegistry.getAddress()
            );
            expect(implementationAddress).to.not.equal(ZERO_ADDRESS);
        });

        it("Should prevent multiple initialization", async function () {
            await expect(
                agentsRegistry.initialize(await mockV1Registry.getAddress(), await serviceRegistry.getAddress())
            ).to.be.reverted;
        });
    });

    describe("2. Agent Registration", function () {
        it("Should register a new agent successfully", async function () {
            const tx = await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );

            await expect(tx)
                .to.emit(agentsRegistry, "AgentRegistered")
                .withArgs(agentAddr1.address, addr1.address, AGENT_NAME_1, AGENT_URI_1);

            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            expect(agentData.name).to.equal(AGENT_NAME_1);
            expect(agentData.agentUri).to.equal(AGENT_URI_1);
            expect(agentData.owner).to.equal(addr1.address);
            expect(agentData.agent).to.equal(agentAddr1.address);
            expect(agentData.reputation).to.equal(0);
            expect(agentData.totalRatings).to.equal(0);
        });

        it("Should fail to register an agent twice", async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );

            await expect(
                agentsRegistry.connect(addr2).registerAgent(
                    agentAddr1.address,
                    AGENT_NAME_2,
                    AGENT_URI_2
                )
            ).to.be.revertedWith("Agent already registered");
        });

        it("Should allow different owners to register different agents", async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );

            await agentsRegistry.connect(addr2).registerAgent(
                agentAddr2.address,
                AGENT_NAME_2,
                AGENT_URI_2
            );

            const agent1Data = await agentsRegistry.getAgentData(agentAddr1.address);
            const agent2Data = await agentsRegistry.getAgentData(agentAddr2.address);

            expect(agent1Data.owner).to.equal(addr1.address);
            expect(agent2Data.owner).to.equal(addr2.address);
        });
    });

    describe("3. Agent Data Management", function () {
        beforeEach(async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );
        });

        it("Should update agent data by owner", async function () {
            const newName = "Updated Agent Name";
            const newUri = "ipfs://QmUpdatedHash/metadata.json";

            const tx = await agentsRegistry.connect(addr1).setAgentData(
                agentAddr1.address,
                newName,
                newUri
            );

            await expect(tx)
                .to.emit(agentsRegistry, "AgentDataUpdated")
                .withArgs(agentAddr1.address, newName, newUri);

            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            expect(agentData.name).to.equal(newName);
            expect(agentData.agentUri).to.equal(newUri);
        });

        it("Should fail to update agent data by non-owner", async function () {
            await expect(
                agentsRegistry.connect(addr2).setAgentData(
                    agentAddr1.address,
                    "New Name",
                    "New URI"
                )
            ).to.be.revertedWith("Not the owner of the agent");
        });

        it("Should fail to update non-existent agent", async function () {
            await expect(
                agentsRegistry.connect(addr1).setAgentData(
                    agentAddr2.address,
                    "New Name",
                    "New URI"
                )
            ).to.be.revertedWith("Not the owner of the agent");
        });
    });

    describe("4. Agent Reputation System", function () {
        beforeEach(async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );
        });

        it("Should add rating to agent", async function () {
            const rating = 85;
            const tx = await agentsRegistry.addRating(agentAddr1.address, rating);

            await expect(tx)
                .to.emit(agentsRegistry, "ReputationUpdated")
                .withArgs(agentAddr1.address, rating);

            const reputation = await agentsRegistry.getReputation(agentAddr1.address);
            expect(reputation).to.equal(rating);

            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            expect(agentData.totalRatings).to.equal(1);
        });

        it("Should calculate average reputation correctly", async function () {
            await agentsRegistry.addRating(agentAddr1.address, 80);
            await agentsRegistry.addRating(agentAddr1.address, 90);
            await agentsRegistry.addRating(agentAddr1.address, 100);

            const reputation = await agentsRegistry.getReputation(agentAddr1.address);
            expect(reputation).to.equal(90); // (80 + 90 + 100) / 3 = 90

            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            expect(agentData.totalRatings).to.equal(3);
        });

        it("Should reject invalid ratings", async function () {
            await expect(
                agentsRegistry.addRating(agentAddr1.address, 101)
            ).to.be.revertedWith("Rating must be between 0 and 100");
        });

        it("Should handle edge case ratings", async function () {
            await agentsRegistry.addRating(agentAddr1.address, 0);
            let reputation = await agentsRegistry.getReputation(agentAddr1.address);
            expect(reputation).to.equal(0);

            await agentsRegistry.addRating(agentAddr1.address, 100);
            reputation = await agentsRegistry.getReputation(agentAddr1.address);
            expect(reputation).to.equal(50); // (0 + 100) / 2 = 50
        });
    });

    describe("5. Agent Removal", function () {
        beforeEach(async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );
        });

        it("Should remove agent by owner", async function () {
            const tx = await agentsRegistry.connect(addr1).removeAgent(agentAddr1.address);

            await expect(tx)
                .to.emit(agentsRegistry, "AgentRemoved")
                .withArgs(agentAddr1.address, addr1.address);

            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            expect(agentData.agent).to.equal(ZERO_ADDRESS);
            expect(agentData.name).to.equal("");
        });

        it("Should fail to remove agent by non-owner", async function () {
            await expect(
                agentsRegistry.connect(addr2).removeAgent(agentAddr1.address)
            ).to.be.revertedWith("Not the owner of the agent");
        });

        it("Should fail to remove non-existent agent", async function () {
            await expect(
                agentsRegistry.connect(addr1).removeAgent(agentAddr2.address)
            ).to.be.revertedWith("Not the owner of the agent");
        });

        it("Should allow re-registration after removal", async function () {
            await agentsRegistry.connect(addr1).removeAgent(agentAddr1.address);

            // Should be able to register the same agent address again
            await agentsRegistry.connect(addr2).registerAgent(
                agentAddr1.address,
                AGENT_NAME_2,
                AGENT_URI_2
            );

            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            expect(agentData.owner).to.equal(addr2.address);
            expect(agentData.name).to.equal(AGENT_NAME_2);
        });
    });

    describe("6. Service Registry Management", function () {
        it("Should set service registry by owner", async function () {
            const newServiceRegistry = await upgrades.deployProxy(ServiceRegistry, [], {
                initializer: "initialize",
                kind: "uups"
            });
            await newServiceRegistry.waitForDeployment();

            await agentsRegistry.connect(owner).setServiceRegistry(
                await newServiceRegistry.getAddress()
            );

            expect(await agentsRegistry.serviceRegistry()).to.equal(
                await newServiceRegistry.getAddress()
            );
        });

        it("Should fail to set service registry by non-owner", async function () {
            await expect(
                agentsRegistry.connect(addr1).setServiceRegistry(addr2.address)
            ).to.be.reverted;
        });

        it("Should fail to set zero address as service registry", async function () {
            await expect(
                agentsRegistry.connect(owner).setServiceRegistry(ZERO_ADDRESS)
            ).to.be.revertedWith("Invalid address");
        });
    });

    describe("7. Access Control", function () {
        beforeEach(async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );
        });

        it("Should enforce onlyAgentOwner modifier", async function () {
            // Try to update agent data as non-owner
            await expect(
                agentsRegistry.connect(addr2).setAgentData(
                    agentAddr1.address,
                    "New Name",
                    "New URI"
                )
            ).to.be.revertedWith("Not the owner of the agent");

            // Try to remove agent as non-owner
            await expect(
                agentsRegistry.connect(addr2).removeAgent(agentAddr1.address)
            ).to.be.revertedWith("Not the owner of the agent");
        });

        it("Should enforce onlyOwner modifier", async function () {
            await expect(
                agentsRegistry.connect(addr1).setServiceRegistry(addr2.address)
            ).to.be.reverted;
        });
    });

    describe("8. Data Retrieval", function () {
        beforeEach(async function () {
            await agentsRegistry.connect(addr1).registerAgent(
                agentAddr1.address,
                AGENT_NAME_1,
                AGENT_URI_1
            );
            await agentsRegistry.addRating(agentAddr1.address, 75);
        });

        it("Should retrieve complete agent data", async function () {
            const agentData = await agentsRegistry.getAgentData(agentAddr1.address);
            
            expect(agentData.name).to.equal(AGENT_NAME_1);
            expect(agentData.agentUri).to.equal(AGENT_URI_1);
            expect(agentData.owner).to.equal(addr1.address);
            expect(agentData.agent).to.equal(agentAddr1.address);
            expect(agentData.reputation).to.equal(75);
            expect(agentData.totalRatings).to.equal(1);
        });

        it("Should retrieve reputation separately", async function () {
            const reputation = await agentsRegistry.getReputation(agentAddr1.address);
            expect(reputation).to.equal(75);
        });

        it("Should return zero values for non-existent agent", async function () {
            const agentData = await agentsRegistry.getAgentData(agentAddr2.address);
            
            expect(agentData.name).to.equal("");
            expect(agentData.agentUri).to.equal("");
            expect(agentData.owner).to.equal(ZERO_ADDRESS);
            expect(agentData.agent).to.equal(ZERO_ADDRESS);
            expect(agentData.reputation).to.equal(0);
            expect(agentData.totalRatings).to.equal(0);
        });
    });
});