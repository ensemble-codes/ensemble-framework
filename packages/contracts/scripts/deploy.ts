import hre from "hardhat";
import { upgrades } from "hardhat";

async function main(): Promise<void> {
    const [deployer] = await hre.ethers.getSigners();

    console.log(`Deployer address: ${deployer.address}`);

    // Deploy ServiceRegistryUpgradeable first (no dependencies)
    console.log("Deploying ServiceRegistryUpgradeable...");
    const ServiceRegistry = await hre.ethers.getContractFactory("ServiceRegistryUpgradeable");
    const serviceRegistry = await upgrades.deployProxy(ServiceRegistry, [], {
        initializer: "initialize",
        kind: "uups"
    });
    await serviceRegistry.waitForDeployment();
    const serviceRegistryAddress = await serviceRegistry.getAddress();
    console.log(`SERVICE_REGISTRY_ADDRESS=${serviceRegistryAddress}`);

    // For AgentsRegistry, we need a V1 registry address - let's create a mock one
    console.log("Deploying mock V1 registry for compatibility...");
    const mockV1Registry = await upgrades.deployProxy(ServiceRegistry, [], {
        initializer: "initialize", 
        kind: "uups"
    });
    await mockV1Registry.waitForDeployment();
    const mockV1Address = await mockV1Registry.getAddress();

    // Deploy AgentsRegistryUpgradeable (depends on ServiceRegistry)
    console.log("Deploying AgentsRegistryUpgradeable...");
    const AgentsRegistry = await hre.ethers.getContractFactory("AgentsRegistryUpgradeable");
    const agentsRegistry = await upgrades.deployProxy(AgentsRegistry, [mockV1Address, serviceRegistryAddress], {
        initializer: "initialize",
        kind: "uups"
    });
    await agentsRegistry.waitForDeployment();
    const agentRegistryAddress = await agentsRegistry.getAddress();
    console.log(`AGENT_REGISTRY_ADDRESS=${agentRegistryAddress}`);

    console.log("\n=== Deployment Summary ===");
    console.log(`ServiceRegistry: ${serviceRegistryAddress}`);
    console.log(`AgentsRegistry: ${agentRegistryAddress}`);
    console.log(`Mock V1 Registry: ${mockV1Address}`);
    
    console.log("\nNote: TaskRegistry has been removed as it's now legacy.");
    console.log("Services and agents are managed independently through their respective registries.");
}

// Error handling and process exit
main()
    .then(() => {
        console.log("Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error during deployment:", error);
        process.exit(1);
    });