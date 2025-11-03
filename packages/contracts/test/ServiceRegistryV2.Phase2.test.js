const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ServiceRegistryUpgradeable V2 - Phase 2: Advanced Features & Agent Management", function () {
    let ServiceRegistry;
    let registry;
    let owner, addr1, addr2, addr3, agentAddr1, agentAddr2;

    // Test data constants
    const IPFS_URI_1 = "ipfs://QmTest1Hash/metadata.json";
    const IPFS_URI_2 = "ipfs://QmTest2Hash/metadata.json";
    const IPFS_URI_UPDATED = "ipfs://QmUpdatedHash/metadata.json";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    // Service status enum values
    const ServiceStatus = {
        DRAFT: 0,
        PUBLISHED: 1,
        ARCHIVED: 2,
        DELETED: 3
    };

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, agentAddr1, agentAddr2] = await ethers.getSigners();
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistryUpgradeable");
        registry = await upgrades.deployProxy(ServiceRegistry, [], {
            initializer: "initialize",
            kind: "uups"
        });
        await registry.waitForDeployment();
    });

    describe("1. Service Status Management", function () {
        let serviceId;

        beforeEach(async function () {
            // Register a service with an agent
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            serviceId = 1;
        });

        it("Should change status from DRAFT to PUBLISHED with agent assigned", async function () {
            const tx = await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);
            
            await expect(tx)
                .to.emit(registry, "ServiceStatusChanged")
                .withArgs(serviceId, ServiceStatus.DRAFT, ServiceStatus.PUBLISHED);

            const service = await registry.getService(serviceId);
            expect(service.status).to.equal(ServiceStatus.PUBLISHED);
        });

        it("Should fail to publish service without agent", async function () {
            // Register service without agent
            await registry.connect(addr1).registerService(IPFS_URI_2, ZERO_ADDRESS);
            const serviceIdNoAgent = 2;

            await expect(
                registry.connect(addr1).setServiceStatus(serviceIdNoAgent, ServiceStatus.PUBLISHED)
            ).to.be.revertedWith("Service must have agent to be published");
        });

        it("Should change status from PUBLISHED to ARCHIVED", async function () {
            // First publish the service
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);
            
            // Then archive it
            const tx = await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.ARCHIVED);
            
            await expect(tx)
                .to.emit(registry, "ServiceStatusChanged")
                .withArgs(serviceId, ServiceStatus.PUBLISHED, ServiceStatus.ARCHIVED);

            const service = await registry.getService(serviceId);
            expect(service.status).to.equal(ServiceStatus.ARCHIVED);
        });

        it("Should change status from PUBLISHED to DRAFT", async function () {
            // First publish the service
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);
            
            // Then set back to draft
            const tx = await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.DRAFT);
            
            await expect(tx)
                .to.emit(registry, "ServiceStatusChanged")
                .withArgs(serviceId, ServiceStatus.PUBLISHED, ServiceStatus.DRAFT);

            const service = await registry.getService(serviceId);
            expect(service.status).to.equal(ServiceStatus.DRAFT);
        });

        it("Should prevent invalid status transitions", async function () {
            // Try to go from DRAFT to DELETED (should be invalid)
            await expect(
                registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.DELETED)
            ).to.be.revertedWith("Invalid status transition");
        });

        it("Should fail to change status by non-owner", async function () {
            await expect(
                registry.connect(addr2).setServiceStatus(serviceId, ServiceStatus.PUBLISHED)
            ).to.be.revertedWith("Not service owner");
        });

        it("Should increment version on status change", async function () {
            const serviceBefore = await registry.getService(serviceId);
            const versionBefore = serviceBefore.version;

            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);

            const serviceAfter = await registry.getService(serviceId);
            expect(serviceAfter.version).to.equal(versionBefore + 1n);
        });
    });

    describe("2. Agent Assignment & Management", function () {
        let serviceId;

        beforeEach(async function () {
            // Register a service without an agent initially
            await registry.connect(addr1).registerService(IPFS_URI_1, ZERO_ADDRESS);
            serviceId = 1;
        });

        it("Should assign agent to service", async function () {
            const tx = await registry.connect(addr1).assignAgentToService(serviceId, agentAddr1.address);
            
            await expect(tx)
                .to.emit(registry, "ServiceAgentAssigned")
                .withArgs(serviceId, agentAddr1.address);

            const service = await registry.getService(serviceId);
            expect(service.agentAddress).to.equal(agentAddr1.address);
        });

        it("Should update servicesByAgent mapping on assignment", async function () {
            await registry.connect(addr1).assignAgentToService(serviceId, agentAddr1.address);

            const agentServices = await registry.getServicesByAgent(agentAddr1.address);
            expect(agentServices.length).to.equal(1);
            expect(agentServices[0]).to.equal(serviceId);
        });

        it("Should reassign agent and clean up old mapping", async function () {
            // Assign first agent
            await registry.connect(addr1).assignAgentToService(serviceId, agentAddr1.address);
            
            // Reassign to second agent
            const tx = await registry.connect(addr1).assignAgentToService(serviceId, agentAddr2.address);
            
            await expect(tx)
                .to.emit(registry, "ServiceAgentUnassigned")
                .withArgs(serviceId, agentAddr1.address);
            
            await expect(tx)
                .to.emit(registry, "ServiceAgentAssigned")
                .withArgs(serviceId, agentAddr2.address);

            // Check mappings
            const agent1Services = await registry.getServicesByAgent(agentAddr1.address);
            const agent2Services = await registry.getServicesByAgent(agentAddr2.address);
            
            expect(agent1Services.length).to.equal(0);
            expect(agent2Services.length).to.equal(1);
            expect(agent2Services[0]).to.equal(serviceId);
        });

        it("Should fail to assign zero address as agent", async function () {
            await expect(
                registry.connect(addr1).assignAgentToService(serviceId, ZERO_ADDRESS)
            ).to.be.revertedWith("Invalid agent address");
        });

        it("Should fail to assign agent by non-owner", async function () {
            await expect(
                registry.connect(addr2).assignAgentToService(serviceId, agentAddr1.address)
            ).to.be.revertedWith("Not service owner");
        });

        it("Should handle multiple services per agent", async function () {
            // Register second service
            await registry.connect(addr1).registerService(IPFS_URI_2, ZERO_ADDRESS);
            const serviceId2 = 2;

            // Assign same agent to both services
            await registry.connect(addr1).assignAgentToService(serviceId, agentAddr1.address);
            await registry.connect(addr1).assignAgentToService(serviceId2, agentAddr1.address);

            const agentServices = await registry.getServicesByAgent(agentAddr1.address);
            expect(agentServices.length).to.equal(2);
            expect(agentServices).to.deep.equal([ethers.getBigInt(1), ethers.getBigInt(2)]);
        });
    });

    describe("3. Agent Unassignment with Status", function () {
        let serviceId;

        beforeEach(async function () {
            // Register a service with an agent and publish it
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            serviceId = 1;
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);
        });

        it("Should unassign agent and set status to DRAFT", async function () {
            const tx = await registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.DRAFT);
            
            await expect(tx)
                .to.emit(registry, "ServiceAgentUnassigned")
                .withArgs(serviceId, agentAddr1.address);
            
            await expect(tx)
                .to.emit(registry, "ServiceStatusChanged")
                .withArgs(serviceId, ServiceStatus.PUBLISHED, ServiceStatus.DRAFT);

            const service = await registry.getService(serviceId);
            expect(service.agentAddress).to.equal(ZERO_ADDRESS);
            expect(service.status).to.equal(ServiceStatus.DRAFT);
        });

        it("Should unassign agent and set status to ARCHIVED", async function () {
            const tx = await registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.ARCHIVED);
            
            await expect(tx)
                .to.emit(registry, "ServiceAgentUnassigned")
                .withArgs(serviceId, agentAddr1.address);
            
            await expect(tx)
                .to.emit(registry, "ServiceStatusChanged")
                .withArgs(serviceId, ServiceStatus.PUBLISHED, ServiceStatus.ARCHIVED);

            const service = await registry.getService(serviceId);
            expect(service.agentAddress).to.equal(ZERO_ADDRESS);
            expect(service.status).to.equal(ServiceStatus.ARCHIVED);
        });

        it("Should fail with invalid status (PUBLISHED)", async function () {
            await expect(
                registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.PUBLISHED)
            ).to.be.revertedWith("Status must be DRAFT or ARCHIVED");
        });

        it("Should fail with invalid status (DELETED)", async function () {
            await expect(
                registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.DELETED)
            ).to.be.revertedWith("Status must be DRAFT or ARCHIVED");
        });

        it("Should fail when no agent is assigned", async function () {
            // Create service without agent
            await registry.connect(addr1).registerService(IPFS_URI_2, ZERO_ADDRESS);
            const serviceId2 = 2;

            await expect(
                registry.connect(addr1).unassignAgentFromService(serviceId2, ServiceStatus.DRAFT)
            ).to.be.revertedWith("No agent assigned");
        });

        it("Should increment version on unassignment", async function () {
            const serviceBefore = await registry.getService(serviceId);
            const versionBefore = serviceBefore.version;

            await registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.DRAFT);

            const serviceAfter = await registry.getService(serviceId);
            expect(serviceAfter.version).to.equal(versionBefore + 1n);
        });

        it("Should properly clean up servicesByAgent mapping", async function () {
            await registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.DRAFT);

            const agentServices = await registry.getServicesByAgent(agentAddr1.address);
            expect(agentServices.length).to.equal(0);
        });
    });

    describe("4. Service Updates", function () {
        let serviceId;

        beforeEach(async function () {
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            serviceId = 1;
        });

        it("Should update service URI", async function () {
            const tx = await registry.connect(addr1).updateService(serviceId, IPFS_URI_UPDATED);
            
            await expect(tx)
                .to.emit(registry, "ServiceUpdated")
                .withArgs(serviceId, IPFS_URI_UPDATED, 2); // version 2 after update

            const service = await registry.getService(serviceId);
            expect(service.serviceUri).to.equal(IPFS_URI_UPDATED);
        });

        it("Should increment version on update", async function () {
            const serviceBefore = await registry.getService(serviceId);
            const versionBefore = serviceBefore.version;

            await registry.connect(addr1).updateService(serviceId, IPFS_URI_UPDATED);

            const serviceAfter = await registry.getService(serviceId);
            expect(serviceAfter.version).to.equal(versionBefore + 1n);
        });

        it("Should fail to update with empty URI", async function () {
            await expect(
                registry.connect(addr1).updateService(serviceId, "")
            ).to.be.revertedWith("Service URI required");
        });

        it("Should fail to update by non-owner", async function () {
            await expect(
                registry.connect(addr2).updateService(serviceId, IPFS_URI_UPDATED)
            ).to.be.revertedWith("Not service owner");
        });

        it("Should fail to update non-existent service", async function () {
            await expect(
                registry.connect(addr1).updateService(999, IPFS_URI_UPDATED)
            ).to.be.revertedWith("Service does not exist");
        });

        it("Should allow multiple updates", async function () {
            const uri1 = "ipfs://Update1/metadata.json";
            const uri2 = "ipfs://Update2/metadata.json";
            const uri3 = "ipfs://Update3/metadata.json";

            await registry.connect(addr1).updateService(serviceId, uri1);
            await registry.connect(addr1).updateService(serviceId, uri2);
            await registry.connect(addr1).updateService(serviceId, uri3);

            const service = await registry.getService(serviceId);
            expect(service.serviceUri).to.equal(uri3);
            expect(service.version).to.equal(4); // Initial version 1 + 3 updates
        });

        it("Should not affect other service properties during update", async function () {
            const serviceBefore = await registry.getService(serviceId);
            
            await registry.connect(addr1).updateService(serviceId, IPFS_URI_UPDATED);
            
            const serviceAfter = await registry.getService(serviceId);
            expect(serviceAfter.id).to.equal(serviceBefore.id);
            expect(serviceAfter.owner).to.equal(serviceBefore.owner);
            expect(serviceAfter.agentAddress).to.equal(serviceBefore.agentAddress);
            expect(serviceAfter.status).to.equal(serviceBefore.status);
        });
    });

    describe("5. Complex Workflow Scenarios", function () {
        it("Should handle complete service lifecycle", async function () {
            // 1. Register service without agent
            await registry.connect(addr1).registerService(IPFS_URI_1, ZERO_ADDRESS);
            const serviceId = 1;
            
            let service = await registry.getService(serviceId);
            expect(service.status).to.equal(ServiceStatus.DRAFT);
            expect(service.version).to.equal(1);

            // 2. Assign an agent
            await registry.connect(addr1).assignAgentToService(serviceId, agentAddr1.address);
            
            // 3. Publish the service
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);
            
            service = await registry.getService(serviceId);
            expect(service.status).to.equal(ServiceStatus.PUBLISHED);

            // 4. Update service metadata
            await registry.connect(addr1).updateService(serviceId, IPFS_URI_UPDATED);
            
            service = await registry.getService(serviceId);
            expect(service.version).to.equal(3); // version 1 + setServiceStatus + updateService

            // 5. Archive the service
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.ARCHIVED);
            
            service = await registry.getService(serviceId);
            expect(service.status).to.equal(ServiceStatus.ARCHIVED);
            expect(service.version).to.equal(4); // version 3 + setServiceStatus
        });

        it("Should handle agent reassignment workflow", async function () {
            // Register service with first agent
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            const serviceId = 1;

            // Publish with first agent
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);

            // Unassign and set to draft
            await registry.connect(addr1).unassignAgentFromService(serviceId, ServiceStatus.DRAFT);

            // Assign new agent
            await registry.connect(addr1).assignAgentToService(serviceId, agentAddr2.address);

            // Republish with new agent
            await registry.connect(addr1).setServiceStatus(serviceId, ServiceStatus.PUBLISHED);

            const service = await registry.getService(serviceId);
            expect(service.agentAddress).to.equal(agentAddr2.address);
            expect(service.status).to.equal(ServiceStatus.PUBLISHED);
        });

        it("Should maintain consistency across multiple services and agents", async function () {
            // Create multiple services with different configurations
            await registry.connect(addr1).registerService(IPFS_URI_1, agentAddr1.address);
            await registry.connect(addr2).registerService(IPFS_URI_2, agentAddr1.address);
            await registry.connect(addr1).registerService("ipfs://Service3", agentAddr2.address);

            // Verify agent1 has 2 services
            let agent1Services = await registry.getServicesByAgent(agentAddr1.address);
            expect(agent1Services.length).to.equal(2);

            // Reassign service 1 from agent1 to agent2
            await registry.connect(addr1).assignAgentToService(1, agentAddr2.address);

            // Verify updated mappings
            agent1Services = await registry.getServicesByAgent(agentAddr1.address);
            const agent2Services = await registry.getServicesByAgent(agentAddr2.address);
            
            expect(agent1Services.length).to.equal(1);
            expect(agent1Services[0]).to.equal(2);
            expect(agent2Services.length).to.equal(2);
            expect(agent2Services).to.deep.equal([ethers.getBigInt(3), ethers.getBigInt(1)]);
        });
    });
});