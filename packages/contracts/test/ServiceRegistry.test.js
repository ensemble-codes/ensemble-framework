const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ServiceRegistry", function () {
    let ServiceRegistry;
    let registry;
    let owner, addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistry");
        registry = await ServiceRegistry.deploy();
    });

    it("Should register a new service", async function () {
        const tx = await registry.registerService("Service1", "Category1", "Description1");
        const receipt = await tx.wait();
        const events = receipt.logs.map(log => {
            try {
                return registry.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        const serviceRegisteredEvent = events.find(event => event.name === "ServiceRegistered");
        expect(serviceRegisteredEvent).to.not.be.undefined;
        expect(serviceRegisteredEvent.args.name).to.equal("Service1");
        expect(serviceRegisteredEvent.args.description).to.equal("Description1");

        const service = await registry.getService("Service1");
        expect(service.name).to.equal("Service1");
        expect(service.category).to.equal("Category1");
        expect(service.description).to.equal("Description1");
    });


    it("Should check if a service is registered", async function () {
        await registry.registerService("Service1", "Category1", "Description1");
        const isRegistered = await registry.isServiceRegistered("Service1");
        expect(isRegistered).to.be.true;

        const isNotRegistered = await registry.isServiceRegistered("NonExistentService");
        expect(isNotRegistered).to.be.false;
    });

})