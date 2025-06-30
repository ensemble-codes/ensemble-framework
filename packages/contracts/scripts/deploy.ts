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

    // Deploy TaskRegistryUpgradeable (depends on AgentsRegistry)
    console.log("Deploying TaskRegistryUpgradeable...");
    const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistryUpgradeable");
    const taskRegistry = await upgrades.deployProxy(TaskRegistry, [1, agentRegistryAddress], {
        initializer: "initialize",
        kind: "uups"
    });
    await taskRegistry.waitForDeployment();
    const taskRegistryAddress = await taskRegistry.getAddress();
    console.log(`TASK_REGISTRY_ADDRESS=${taskRegistryAddress}`);

    console.log("\n=== Deployment Summary ===");
    console.log(`ServiceRegistry: ${serviceRegistryAddress}`);
    console.log(`AgentsRegistry: ${agentRegistryAddress}`);
    console.log(`TaskRegistry: ${taskRegistryAddress}`);
    console.log(`Mock V1 Registry: ${mockV1Address}`);

    // Uncomment the lines below if you want to create tasks for testing
    /*
    const tx1 = await taskRegistry.createTask("Do X for me", 0);
    console.log(`First task created in tx: ${tx1.hash}`);

    const tx2 = await taskRegistry.createTask("Do Y for me", 0);
    console.log(`Second task created in tx: ${tx2.hash}`);

    const tasks = await taskRegistry.getTasksByOwner(deployer.address);
    console.log("Tasks created by deployer:", tasks);
    */
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
