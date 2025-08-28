const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ServiceRegistryUpgradeable V2 - Phase 1: Core Functionality", function () {
    let ServiceRegistry;
    let registry;
    let owner, addr1, addr2, agentAddr1, agentAddr2;

    // Test data constants
    const IPFS_URI_1 = "ipfs://QmTest1Hash/metadata.json";
    const IPFS_URI_2 = "ipfs://QmTest2Hash/metadata.json";
    const IPFS_URI_3 = "ipfs://QmTest3Hash/metadata.json";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, addr1, addr2, agentAddr1, agentAddr2] = await ethers.getSigners();
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistryUpgradeable");
        registry = await upgrades.deployProxy(ServiceRegistry, [], {
            initializer: "initialize",
            kind: "uups"
        });
        await registry.waitForDeployment();
    });

    describe("1. Contract Initialization & Deployment", function () {
        it("Should initialize with correct initial state", async function () {
            // Check initial state
            expect(await registry.nextServiceId()).to.equal(0);
            expect(await registry.totalServices()).to.equal(0);
            expect(await registry.owner()).to.equal(owner.address);
        });

        it("Should be deployed as UUPS proxy", async function () {
            // Verify proxy deployment
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(await registry.getAddress());
            expect(implementationAddress).to.not.equal(ZERO_ADDRESS);
        });

        it("Should prevent multiple initialization", async function () {
            // Try to initialize again - should revert with custom error
            await expect(registry.initialize()).to.be.reverted;
        });

        it("Should set correct owner during initialization", async function () {
            expect(await registry.owner()).to.equal(owner.address);
        });
    });

    describe("2. Basic Service Registration", function () {
        it("Should register a service with IPFS URI and agent address", async function () {
            const tx = await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            
            // Check event emission
            await expect(tx)
                .to.emit(registry, "ServiceRegistered")
                .withArgs(1, addr1.address, IPFS_URI_1);

            // Verify service data
            const service = await registry.getService(1);
            expect(service.id).to.equal(1);
            expect(service.owner).to.equal(addr1.address);
            expect(service.agentAddress).to.equal(agentAddr1.address);
            expect(service.serviceUri).to.equal(IPFS_URI_1);
            expect(service.status).to.equal(0); // DRAFT
            expect(service.version).to.equal(1);

            // Check counters
            expect(await registry.nextServiceId()).to.equal(1);
            expect(await registry.getTotalServiceCount()).to.equal(1);
        });

        it("Should register a service with URI only (no agent)", async function () {
            const tx = await registry.connect(addr1).registerService(IPFS_URI_1, ZERO_ADDRESS);
            
            await expect(tx)
                .to.emit(registry, "ServiceRegistered")
                .withArgs(1, addr1.address, IPFS_URI_1);

            const service = await registry.getService(1);
            expect(service.agentAddress).to.equal(ZERO_ADDRESS);
            expect(service.serviceUri).to.equal(IPFS_URI_1);
            expect(service.status).to.equal(0); // DRAFT
        });

        it("Should auto-increment service IDs correctly", async function () {
            // Register first service
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            expect(await registry.nextServiceId()).to.equal(1);
            
            // Register second service
            await registry.connect(addr2).registerService(IPFS_URI_2, agentAddr2.address);
            expect(await registry.nextServiceId()).to.equal(2);
            
            // Register third service
            await registry.connect(addr1).registerService(IPFS_URI_3, ZERO_ADDRESS);
            expect(await registry.nextServiceId()).to.equal(3);

            // Verify all services exist with correct IDs
            const service1 = await registry.getService(1);
            const service2 = await registry.getService(2);
            const service3 = await registry.getService(3);
            
            expect(service1.id).to.equal(1);
            expect(service2.id).to.equal(2);
            expect(service3.id).to.equal(3);
            
            expect(await registry.getTotalServiceCount()).to.equal(3);
        });

        it("Should fail on empty service URI", async function () {
            await expect(registry.connect(addr1).registerService("", agentAddr1.address))
                .to.be.revertedWith("Service URI required");
        });

        it("Should update servicesByOwner mapping correctly", async function () {
            // Register services by different owners
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            await registry.connect(addr1).registerService(IPFS_URI_2, agentAddr2.address);
            await registry.connect(addr2).registerService(IPFS_URI_3, ZERO_ADDRESS);

            // Check servicesByOwner mapping
            const addr1Services = await registry.getServicesByOwner(addr1.address);
            const addr2Services = await registry.getServicesByOwner(addr2.address);

            expect(addr1Services.length).to.equal(2);
            expect(addr1Services[0]).to.equal(1);
            expect(addr1Services[1]).to.equal(2);

            expect(addr2Services.length).to.equal(1);
            expect(addr2Services[0]).to.equal(3);
        });

        it("Should update servicesByAgent mapping when agent is provided", async function () {
            // Register services with agents
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            await registry.connect(addr2).registerService(IPFS_URI_2, agentAddr1.address); // Same agent
            await registry.connect(addr1).registerService(IPFS_URI_3, ZERO_ADDRESS); // No agent

            // Check servicesByAgent mapping
            const agent1Services = await registry.getServicesByAgent(agentAddr1.address);
            const agent2Services = await registry.getServicesByAgent(agentAddr2.address);
            const zeroServices = await registry.getServicesByAgent(ZERO_ADDRESS);

            expect(agent1Services.length).to.equal(2);
            expect(agent1Services[0]).to.equal(1);
            expect(agent1Services[1]).to.equal(2);

            expect(agent2Services.length).to.equal(0);
            expect(zeroServices.length).to.equal(0); // Zero address shouldn't have services
        });

        it("Should emit ServiceRegistered event with correct parameters", async function () {
            const tx = registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            
            await expect(tx)
                .to.emit(registry, "ServiceRegistered")
                .withArgs(1, addr1.address, IPFS_URI_1);
        });
    });

    describe("3. Service Retrieval & Basic Queries", function () {
        beforeEach(async function () {
            // Setup test data
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            await registry.connect(addr1).registerService(IPFS_URI_2, agentAddr2.address);
            await registry.connect(addr2).registerService(IPFS_URI_3, ZERO_ADDRESS);
        });

        it("Should retrieve service by ID correctly", async function () {
            const service = await registry.getService(1);
            
            expect(service.id).to.equal(1);
            expect(service.owner).to.equal(addr1.address);
            expect(service.agentAddress).to.equal(agentAddr1.address);
            expect(service.serviceUri).to.equal(IPFS_URI_1);
            expect(service.status).to.equal(0); // DRAFT
            expect(service.version).to.equal(1);
        });

        it("Should fail to retrieve non-existent service", async function () {
            await expect(registry.getService(999))
                .to.be.revertedWith("Service does not exist");
        });

        it("Should fail to retrieve service with ID 0", async function () {
            await expect(registry.getService(0))
                .to.be.revertedWith("Service does not exist");
        });

        it("Should get services by owner correctly", async function () {
            const addr1Services = await registry.getServicesByOwner(addr1.address);
            const addr2Services = await registry.getServicesByOwner(addr2.address);
            
            expect(addr1Services.length).to.equal(2);
            expect(addr1Services).to.deep.equal([ethers.getBigInt(1), ethers.getBigInt(2)]);
            
            expect(addr2Services.length).to.equal(1);
            expect(addr2Services).to.deep.equal([ethers.getBigInt(3)]);
        });

        it("Should return empty array for owner with no services", async function () {
            const [newAddr] = await ethers.getSigners();
            const services = await registry.getServicesByOwner(newAddr.address);
            expect(services.length).to.equal(0);
        });

        it("Should get services by agent correctly", async function () {
            const agent1Services = await registry.getServicesByAgent(agentAddr1.address);
            const agent2Services = await registry.getServicesByAgent(agentAddr2.address);
            
            expect(agent1Services.length).to.equal(1);
            expect(agent1Services).to.deep.equal([ethers.getBigInt(1)]);
            
            expect(agent2Services.length).to.equal(1);
            expect(agent2Services).to.deep.equal([ethers.getBigInt(2)]);
        });

        it("Should return total service count correctly", async function () {
            expect(await registry.getTotalServiceCount()).to.equal(3);
            
            // Register another service
            await registry.connect(addr2).registerService(IPFS_URI_1, agentAddr1.address);
            expect(await registry.getTotalServiceCount()).to.equal(4);
        });

        it("Should get service owner correctly", async function () {
            expect(await registry.getServiceOwner(1)).to.equal(addr1.address);
            expect(await registry.getServiceOwner(2)).to.equal(addr1.address);
            expect(await registry.getServiceOwner(3)).to.equal(addr2.address);
        });

        it("Should fail to get owner of non-existent service", async function () {
            await expect(registry.getServiceOwner(999))
                .to.be.revertedWith("Service does not exist");
        });
    });

    describe("4. Service Existence Validation", function () {
        beforeEach(async function () {
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
        });

        it("Should validate existing service ID", async function () {
            // This should not revert
            await registry.getService(1);
        });

        it("Should reject service ID 0", async function () {
            await expect(registry.getService(0))
                .to.be.revertedWith("Service does not exist");
        });

        it("Should reject service ID greater than nextServiceId", async function () {
            await expect(registry.getService(2))
                .to.be.revertedWith("Service does not exist");
        });

        it("Should handle edge case at boundary", async function () {
            // Register second service
            await registry.connect(addr1).registerService(IPFS_URI_2, agentAddr2.address);
            
            // Service ID 2 should exist
            await registry.getService(2);
            
            // Service ID 3 should not exist
            await expect(registry.getService(3))
                .to.be.revertedWith("Service does not exist");
        });
    });

    describe("5. Gas Optimization Verification", function () {
        it("Should register service efficiently", async function () {
            const tx = await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            const receipt = await tx.wait();
            
            // Gas usage should be reasonable (adjust threshold as needed)
            expect(receipt.gasUsed).to.be.below(350000); // 350k gas threshold for initial service
        });

        it("Should handle multiple services per owner efficiently", async function () {
            // Register multiple services and check gas doesn't increase significantly
            const tx1 = await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            const receipt1 = await tx1.wait();
            
            const tx2 = await registry.connect(addr1).registerService(IPFS_URI_2, agentAddr2.address);
            const receipt2 = await tx2.wait();
            
            // Second registration should not be significantly more expensive
            const gasIncrease = receipt2.gasUsed - receipt1.gasUsed;
            expect(gasIncrease).to.be.below(50000); // 50k gas increase threshold
        });
    });
});