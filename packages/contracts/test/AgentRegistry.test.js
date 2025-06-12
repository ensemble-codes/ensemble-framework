const { expect } = require("chai");
const { ethers } = require("hardhat");
const AgentRegistryV1Artifact = require('./artifacts/AgentsRegistryV1.json')

describe("AgentRegistry", function () {
    let AgentRegistry;
    let agentRegistryV1
    let registry;
    let serviceRegistry;
    let serviceRegistryV1;
    let admin, agentOwner, agentAddress;
    let agentUri = "https://ipfs.io/ipfs/bafkreigzpb44ndvlsfazfymmf6yvquoregceik56vyskf7e35joel7yati";

    beforeEach(async function () {
        [admin, agentOwner, agentAddress, eveAddress] = await ethers.getSigners();
        
        const ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
        serviceRegistry = await ServiceRegistry.deploy();

        const ServiceRegistryV1 = await ethers.getContractFactory("ServiceRegistry");
        serviceRegistryV1 = await ServiceRegistryV1.deploy();

        const AgentRegistryV1 = await ethers.getContractFactoryFromArtifact(AgentRegistryV1Artifact);
        agentRegistryV1 = await AgentRegistryV1.deploy(serviceRegistryV1.target);

        AgentRegistry = await ethers.getContractFactory("AgentsRegistry");
        registry = await AgentRegistry.deploy(agentRegistryV1.target, serviceRegistry.target);
    });

    describe('#Setters', () => {
        it("should set the address of the TaskRegistry contract", async function () {
            const newTaskRegistryAddress = agentAddress;
            await registry.connect(admin).setTaskRegistry(newTaskRegistryAddress);
            expect(await registry.taskRegistry()).to.equal(newTaskRegistryAddress);
        });

        it("should set the address of the ServiceRegistry contract", async function () {
            const newServiceRegistryAddress = agentAddress;
            await registry.connect(admin).setServiceRegistry(newServiceRegistryAddress);
            expect(await registry.serviceRegistry()).to.equal(newServiceRegistryAddress);
        });
    })

    describe('#registerAgent', () => {
        it("Should register a new agent without proposal", async function () {
            const request = registry.connect(agentOwner).registerAgent(
                agentAddress,
                "Simple Agent",
                agentUri
            );

            await expect(request)
                .to.emit(registry, "AgentRegistered")
                .withArgs(agentAddress, agentOwner, "Simple Agent", agentUri);
            
            const agentData = await registry.getAgentData(agentAddress);

            expect(agentData.name).to.equal("Simple Agent");
            expect(agentData.agentUri).to.equal(agentUri);
            expect(agentData.owner).to.equal(agentOwner.address);
            expect(agentData.agent).to.equal(agentAddress);
            expect(agentData.reputation).to.equal(0);
            expect(agentData.totalRatings).to.equal(0);
        });

        it("Should not register the same agent twice", async function () {
            await registry.connect(agentOwner).registerAgent(
                agentAddress,
                "Simple Agent",
                agentUri
            );

            await expect(
                registry.connect(agentOwner).registerAgent(
                    agentAddress,
                    "Another Agent",
                    agentUri
                )
            ).to.be.revertedWith("Agent already registered");
        });

        it("Should handle empty name parameter", async function () {
            const request = registry.connect(agentOwner).registerAgent(
                agentAddress,
                "",
                agentUri
            );

            await expect(request)
                .to.emit(registry, "AgentRegistered")
                .withArgs(agentAddress, agentOwner, "", agentUri);
        });

        it("Should handle empty agentUri parameter", async function () {
            const request = registry.connect(agentOwner).registerAgent(
                agentAddress,
                "Simple Agent",
                ""
            );

            await expect(request)
                .to.emit(registry, "AgentRegistered")
                .withArgs(agentAddress, agentOwner, "Simple Agent", "");
        });

        it("Should allow multiple agents registered by the same owner", async function () {
            const [, , secondAgent] = await ethers.getSigners();

            await registry.connect(agentOwner).registerAgent(
                agentAddress,
                "First Agent",
                agentUri
            );

            await registry.connect(agentOwner).registerAgent(
                eveAddress,
                "Second Agent",
                agentUri
            );

            const firstAgentData = await registry.getAgentData(agentAddress);
            const secondAgentData = await registry.getAgentData(eveAddress);

            expect(firstAgentData.owner).to.equal(agentOwner.address);
            expect(secondAgentData.owner).to.equal(agentOwner.address);
            expect(firstAgentData.name).to.equal("First Agent");
            expect(secondAgentData.name).to.equal("Second Agent");
        });

        it("Should handle agent address same as owner address", async function () {
            await registry.connect(agentOwner).registerAgent(
                agentOwner.address,
                "Self Agent",
                agentUri
            );

            const agentData = await registry.getAgentData(agentOwner.address);
            expect(agentData.owner).to.equal(agentOwner.address);
            expect(agentData.agent).to.equal(agentOwner.address);
        });

        it("Should handle very long strings", async function () {
            const longName = "A".repeat(1000);
            const longUri = "https://".concat("very-long-uri-".repeat(100));

            await registry.connect(agentOwner).registerAgent(
                agentAddress,
                longName,
                longUri
            );

            const agentData = await registry.getAgentData(agentAddress);
            expect(agentData.name).to.equal(longName);
            expect(agentData.agentUri).to.equal(longUri);
        });

        it("Should not create any proposals when using registerAgent", async function () {
            await registry.connect(agentOwner).registerAgent(
                agentAddress,
                "Simple Agent",
                agentUri
            );

            // Since proposals start at ID 1, checking if proposal 1 exists should return default values
            const proposal = await registry.getProposal(1);
            expect(proposal.issuer).to.equal(ethers.ZeroAddress);
            expect(proposal.serviceName).to.equal("");
            expect(proposal.price).to.equal(0);
            expect(proposal.proposalId).to.equal(0);
            expect(proposal.isActive).to.equal(false);
        });
    })

    describe('#registerAgentWithProposal', () => {
        this.beforeEach(async function () {
            await serviceRegistry.registerService("Service1", "Category1", "Description1");
        })
        it("Should not register an agent if the service is not registered", async function () {
            await expect(
                registry.connect(agentOwner).registerAgentWithProposal(
                    agentAddress,
                    "Service Agent",
                    agentUri,
                    "NonExistentService",
                    ethers.parseEther("0.01")
                )
            ).to.be.revertedWith("Service not registered");
        });

        it("Should register new agent", async function () {
            const request = registry.connect(agentOwner).registerAgentWithProposal(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );

            await expect(request)
                .to.emit(registry, "AgentRegistered")
                .withArgs(agentAddress, agentOwner, "Service Agent", agentUri)
                .to.emit(registry, "ProposalAdded")
                .withArgs(agentAddress, 1, "Service1", ethers.parseEther("0.01"));
            
            const agentData = await registry.getAgentData(agentAddress);

            expect(agentData.name).to.equal("Service Agent");
            expect(agentData.agentUri).to.equal(agentUri);
            expect(agentData.owner).to.equal(agentOwner.address);
            expect(agentData.agent).to.equal(agentAddress);
            expect(agentData.reputation).to.equal(0);

            const proposalId = 1;
            const proposal = await registry.getProposal(proposalId);
            expect(proposal.issuer).to.equal(agentAddress);
            expect(proposal.serviceName).to.equal("Service1");
            expect(proposal.price).to.equal(ethers.parseEther("0.01"));
            expect(proposal.proposalId).to.equal(proposalId);
        });

        it("Should not register the same agent twice", async function () {
            await registry.connect(agentOwner).registerAgentWithProposal(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );

            await expect(
                registry.connect(agentOwner).registerAgentWithProposal(
                    agentAddress,
                    "Service Agent",
                    agentUri,
                    "Service1",
                    ethers.parseEther("0.01")
                )
            ).to.be.revertedWith("Agent already registered");
        });
    })


    describe('#Proposals', () => {

        beforeEach(async function () {
            // await serviceRegistry.registerService("Service1", "Category1", "Description1");
            await registry.connect(agentOwner).registerAgentWithProposal(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );
        });


        it("Should add a proposal", async function () {
            await registry.connect(agentOwner).addProposal(agentAddress, "Service1", ethers.parseEther("0.02"));
            const proposalId = 2
            expect(await registry.getProposal(proposalId)).to.deep.equal([
                agentAddress.address,
                "Service1",
                ethers.parseEther("0.02"),
                proposalId,
                true
            ]);
        });

        it("Should not add a proposal if service is not registered", async function () {
            await expect(registry.connect(agentOwner).addProposal(agentAddress, "NonExistentService", ethers.parseEther("0.02")))
                .to.be.revertedWith("Service not registered");
        });

        it("Should remove a proposal", async function () {

            await registry.connect(agentOwner).addProposal(agentAddress, "Service1", ethers.parseEther("0.02"));

            await registry.connect(agentOwner).removeProposal(agentAddress, 2);

            expect(await registry.getProposal(2)).to.deep.equal([
                ethers.ZeroAddress,
                "",
                0,
                0,
                false
            ]);


            await registry.connect(agentOwner).removeProposal(agentAddress, 1);

            expect(await registry.getProposal(1)).to.deep.equal([
                ethers.ZeroAddress,
                "",
                0,
                0,
                false
            ]);
        });
    });


    describe('#Reputation', () => {

        beforeEach(async () => {
            await registry.connect(agentOwner).registerAgentWithProposal(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );
        })
        it("Should only allow taskRegistry to add a rating", async function () {
            // Attempt to add a rating from a different address
            await expect(registry.connect(agentOwner).addRating(agentAddress, 50)).to.be.revertedWith("Not the TaskRegistry contract");

            await registry.connect(admin).setTaskRegistry(admin);

            await expect(registry.connect(admin).addRating(agentAddress, 50)).to.not.be.reverted;
        });

        it("Should add a rating", async function () {
            await registry.connect(admin).setTaskRegistry(admin);

            await expect(registry.connect(admin).addRating(agentAddress, 50))
                .to.emit(registry, "ReputationUpdated")
                .withArgs(agentAddress, 50);
            let agentData = await registry.getAgentData(agentAddress);
            expect(agentData.reputation).to.equal(50);
            expect(agentData.totalRatings).to.equal(1);
            expect(await registry.getReputation(agentAddress)).to.equal(50);

            await expect(registry.connect(admin).addRating(agentAddress, 100))
                .to.emit(registry, "ReputationUpdated")
                .withArgs(agentAddress, 75);
            
            agentData = await registry.getAgentData(agentAddress);
            expect(agentData.reputation).to.equal(75);
            expect(agentData.totalRatings).to.equal(2);

            await expect(registry.connect(admin).addRating(agentAddress, 30))
            .to.emit(registry, "ReputationUpdated")
            .withArgs(agentAddress, 60);
        
            agentData = await registry.getAgentData(agentAddress);
            expect(agentData.reputation).to.equal(60);
            expect(agentData.totalRatings).to.equal(3);
        })
    })

    describe('#MigrateAgent', () => {
        this.beforeEach(async function () {
            await serviceRegistryV1.registerService("Service1", "Category1", "Description1");
        })

        // FIXME: figure out why getAgentData is not returning the correct data
        it("Should migrate an agent to a new registry", async function () {
            await agentRegistryV1.connect(agentOwner).registerAgent(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );

            await expect(
                registry.connect(eveAddress).migrateAgent(agentAddress)
            ).to.be.revertedWith("Not owner or agent owner");

            await registry.migrateAgent(agentAddress)

            const agentData = await registry.getAgentData(agentAddress);

            expect(agentData.name).to.equal("Service Agent");
            expect(agentData.agentUri).to.equal(agentUri);
            expect(agentData.owner).to.equal(agentOwner.address);
            expect(agentData.agent).to.equal(agentAddress);
            expect(agentData.reputation).to.equal(0);
        });
    })

    describe('#UpdateAgentData', () => {
        const newAgentName = "Updated Agent Name";
        const newAgentUri = "https://ipfs.io/ipfs/updated-hash";

        beforeEach(async function () {
            await registry.connect(agentOwner).registerAgent(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );
        });

        it("Should successfully update agent data", async function () {
            const updateTx = registry.connect(agentOwner).updateAgentData(
                agentAddress,
                newAgentName,
                newAgentUri
            );

            await expect(updateTx)
                .to.emit(registry, "AgentDataUpdated")
                .withArgs(agentAddress, newAgentName, newAgentUri);

            const agentData = await registry.getAgentData(agentAddress);
            expect(agentData.name).to.equal(newAgentName);
            expect(agentData.agentUri).to.equal(newAgentUri);
            
            // Verify other fields remain unchanged
            expect(agentData.owner).to.equal(agentOwner.address);
            expect(agentData.agent).to.equal(agentAddress);
            expect(agentData.reputation).to.equal(0);
            expect(agentData.totalRatings).to.equal(0);
        });

        it("Should not allow non-owner to update agent data", async function () {
            const [, , , unauthorizedUser] = await ethers.getSigners();
            
            await expect(
                registry.connect(unauthorizedUser).updateAgentData(
                    agentAddress,
                    newAgentName,
                    newAgentUri
                )
            ).to.be.revertedWith("Not the owner of the agent");
        });

        it("Should not allow updating unregistered agent", async function () {
            const [, , , , unregisteredAgent] = await ethers.getSigners();
            
            await expect(
                registry.connect(unregisteredAgent).updateAgentData(
                    unregisteredAgent.address,
                    newAgentName,
                    newAgentUri
                )
            ).to.be.revertedWith("Not the owner of the agent");
        });

        it("Should allow updating with empty strings", async function () {
            const emptyName = "";
            const emptyUri = "";

            const updateTx = registry.connect(agentOwner).updateAgentData(
                agentAddress,
                emptyName,
                emptyUri
            );

            await expect(updateTx)
                .to.emit(registry, "AgentDataUpdated")
                .withArgs(agentAddress, emptyName, emptyUri);

            const agentData = await registry.getAgentData(agentAddress);
            expect(agentData.name).to.equal(emptyName);
            expect(agentData.agentUri).to.equal(emptyUri);
        });

        it("Should allow updating only name", async function () {
            const originalAgentData = await registry.getAgentData(agentAddress);
            
            await registry.connect(agentOwner).updateAgentData(
                agentAddress,
                newAgentName,
                originalAgentData.agentUri // Keep original URI
            );

            const updatedAgentData = await registry.getAgentData(agentAddress);
            expect(updatedAgentData.name).to.equal(newAgentName);
            expect(updatedAgentData.agentUri).to.equal(originalAgentData.agentUri);
        });

        it("Should allow updating only URI", async function () {
            const originalAgentData = await registry.getAgentData(agentAddress);
            
            await registry.connect(agentOwner).updateAgentData(
                agentAddress,
                originalAgentData.name, // Keep original name
                newAgentUri
            );

            const updatedAgentData = await registry.getAgentData(agentAddress);
            expect(updatedAgentData.name).to.equal(originalAgentData.name);
            expect(updatedAgentData.agentUri).to.equal(newAgentUri);
        });

        it("Should preserve reputation and ratings after update", async function () {
            // Add some reputation first
            await registry.connect(admin).setTaskRegistry(admin);
            await registry.connect(admin).addRating(agentAddress, 80);
            
            const originalAgentData = await registry.getAgentData(agentAddress);
            expect(originalAgentData.reputation).to.equal(80);
            expect(originalAgentData.totalRatings).to.equal(1);

            // Update agent data
            await registry.connect(agentOwner).updateAgentData(
                agentAddress,
                newAgentName,
                newAgentUri
            );

            // Verify reputation and ratings are preserved
            const updatedAgentData = await registry.getAgentData(agentAddress);
            expect(updatedAgentData.reputation).to.equal(80);
            expect(updatedAgentData.totalRatings).to.equal(1);
            expect(updatedAgentData.name).to.equal(newAgentName);
            expect(updatedAgentData.agentUri).to.equal(newAgentUri);
        });

        it("Should allow multiple updates", async function () {
            // First update
            await registry.connect(agentOwner).updateAgentData(
                agentAddress,
                "First Update",
                "https://first-update.com"
            );

            let agentData = await registry.getAgentData(agentAddress);
            expect(agentData.name).to.equal("First Update");
            expect(agentData.agentUri).to.equal("https://first-update.com");

            // Second update
            await registry.connect(agentOwner).updateAgentData(
                agentAddress,
                "Second Update",
                "https://second-update.com"
            );

            agentData = await registry.getAgentData(agentAddress);
            expect(agentData.name).to.equal("Second Update");
            expect(agentData.agentUri).to.equal("https://second-update.com");
        });
    });
});
