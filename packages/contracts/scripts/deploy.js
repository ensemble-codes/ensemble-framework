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

    // Deploy TaskRegistryUpgradeable
    const TaskRegistry = await ethers.getContractFactory("TaskRegistryUpgradeable");
    const taskRegistry = await upgrades.deployProxy(TaskRegistry, [1, await agentsRegistry.getAddress()], {
        initializer: "initialize",
        kind: "uups"
    });
    await taskRegistry.waitForDeployment();
    console.log("TaskRegistryUpgradeable deployed to:", await taskRegistry.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });