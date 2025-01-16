import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentsRegistry");
    const agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.deployed();
    console.log("AgentsRegistry deployed to:", agentRegistry.address);

    // Deploy TaskRegistry
    const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
    const taskRegistry = await TaskRegistry.deploy();
    await taskRegistry.deployed();
    console.log("TaskRegistry deployed to:", taskRegistry.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });