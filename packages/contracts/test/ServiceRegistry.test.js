const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ServiceRegistryUpgradeable", function () {
    let ServiceRegistry;
    let registry;
    let owner, addr1;

    let service1 = "Service1";
    let category1 = "Category1";
    let description1 = "Description1";

    let category2 = "Category2";
    let description2 = "Description2";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        ServiceRegistry = await ethers.getContractFactory("ServiceRegistryUpgradeable");
        registry = await upgrades.deployProxy(ServiceRegistry, [], {
            initializer: "initialize",
            kind: "uups"
        });
    });

    it("Should register a new service", async function () {
        const request = registry.registerService(service1, category1, description1)

        await expect(request)
            .to.emit(registry, "ServiceRegistered")
            .withArgs(service1, category1, description1);

        const isRegistered = await registry.isServiceRegistered(service1);
        expect(isRegistered).to.be.true;

        const service = await registry.getService(service1);
        expect(service.name).to.equal(service1);
        expect(service.category).to.equal(category1);
        expect(service.description).to.equal(description1);
    });

    it("Should not register a service twice", async function () {
        await registry.registerService(service1, category1, description1);
        await expect(registry.registerService(service1, category1, description1)).to.be.revertedWith("Service already registered");
    });

    it("Should not register a service with an empty name", async function () {
        await expect(registry.registerService("", category1, description1)).to.be.revertedWith("Invalid service name");
    });

    it("Should not update a service if it is not registered", async function () {
        await expect(registry.updateService(service1, category2, description2)).to.be.revertedWith("Service not registered");
    });


    it("Should update a service", async function () {
        await registry.registerService(service1, category1, description1);
        const request = registry.updateService(service1, category2, description2);

        await expect(request)
            .to.emit(registry, "ServiceUpdated")
            .withArgs(service1, category2, description2);

        const service = await registry.getService(service1);
        expect(service.name).to.equal(service1);
        expect(service.category).to.equal(category2);
        expect(service.description).to.equal(description2);

    });

})