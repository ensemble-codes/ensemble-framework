import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy ServiceRegistryUpgradeable
    const ServiceRegistry = await ethers.getContractFactory("ServiceRegistryUpgradeable");
    const serviceRegistry = await upgrades.deployProxy(ServiceRegistry, [], {
        initializer: "initialize",
        kind: "uups"
    });
    await serviceRegistry.waitForDeployment();
    console.log("ServiceRegistryUpgradeable deployed to:", await serviceRegistry.getAddress());

    // Deploy mock V1 registry for compatibility
    const mockV1Registry = await upgrades.deployProxy(ServiceRegistry, [], {
        initializer: "initialize",
        kind: "uups"
    });
    await mockV1Registry.waitForDeployment();

    // Deploy AgentsRegistryUpgradeable
    const AgentsRegistry = await ethers.getContractFactory("AgentsRegistryUpgradeable");
    const agentsRegistry = await upgrades.deployProxy(AgentsRegistry, [await mockV1Registry.getAddress(), await serviceRegistry.getAddress()], {
        initializer: "initialize",
        kind: "uups"
    });
    await agentsRegistry.waitForDeployment();
    console.log("AgentsRegistryUpgradeable deployed to:", await agentsRegistry.getAddress());

    console.log("\nNote: TaskRegistry has been removed as it's now legacy.");
    console.log("Services and agents are managed independently through their respective registries.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });