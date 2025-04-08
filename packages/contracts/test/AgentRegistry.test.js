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

    describe('#RegisterAgent', () => {
        this.beforeEach(async function () {
            await serviceRegistry.registerService("Service1", "Category1", "Description1");
        })
        it("Should not register an agent if the service is not registered", async function () {
            await expect(
                registry.connect(agentOwner).registerAgent(
                    agentAddress,
                    "Service Agent",
                    agentUri,
                    "NonExistentService",
                    ethers.parseEther("0.01")
                )
            ).to.be.revertedWith("Service not registered");
        });

        it("Should register new agent", async function () {
            const request = registry.connect(agentOwner).registerAgent(
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
            await registry.connect(agentOwner).registerAgent(
                agentAddress,
                "Service Agent",
                agentUri,
                "Service1",
                ethers.parseEther("0.01")
            );

            await expect(
                registry.connect(agentOwner).registerAgent(
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
            registry.connect(agentOwner).registerAgent(
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
            await registry.connect(agentOwner).registerAgent(
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
});
