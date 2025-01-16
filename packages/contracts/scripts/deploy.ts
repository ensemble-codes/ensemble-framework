import hre from "hardhat";
import AgentsRegistry from "../ignition/modules/AgentsRegistry";
import TaskRegistry from "../ignition/modules/TaskRegistry";
import ServiceRegistry from "../ignition/modules/ServiceRegistry";

async function main(): Promise<void> {
    const [deployer] = await hre.ethers.getSigners();

    console.log(`Deployer address: ${deployer.address}`);

    // Deploy AgentsRegistry
    const { agentsRegistry } = await hre.ignition.deploy(AgentsRegistry);
    const agentRegistryAddress = await agentsRegistry.getAddress();
    console.log(`AGENT_REGISTRY_ADDRESS=${agentRegistryAddress}`);

    // Deploy TaskRegistry
    const { taskRegistry } = await hre.ignition.deploy(TaskRegistry);
    const taskRegistryAddress = await taskRegistry.getAddress();
    console.log(`TASK_REGISTRY_ADDRESS=${taskRegistryAddress}`);

    // Deploy ServiceRegistry
    const { serviceRegistry } = await hre.ignition.deploy(ServiceRegistry);
    const serviceRegistryAddress = await serviceRegistry.getAddress();
    console.log(`SERVICE_REGISTRY_ADDRESS=${serviceRegistryAddress}`);

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
