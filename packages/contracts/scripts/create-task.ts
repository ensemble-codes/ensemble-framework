import { TaskRegistryUpgradeable } from "../typechain-types";
require('dotenv').config('../.env');

const hre = require("hardhat");

async function main() {
    const taskRegistryAddress = process.env.TASK_REGISTRY_ADDRESS;
    console.log("Task Registry Address:", taskRegistryAddress);
    // Get the contract factory and deployer
    const [deployer] = await hre.ethers.getSigners();

    console.log("account address:", deployer.address);

    // Get the deployed contract instance
    const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistryUpgradeable");
    const taskRegistry = await TaskRegistry.attach(taskRegistryAddress) as TaskRegistryUpgradeable;

    try {
        // Create a task without ignition
        const simpleTask = await taskRegistry.createTask(
            "Do X for me",
            0
        );
        // Wait for the transaction to be mined
        const simpleTaskReceipt = await simpleTask.wait();
        console.log("Simple task created in tx:", simpleTaskReceipt?.hash);


        // const secondTask = await taskRegistry.createTask(
        //     "Do Y for me",
        //     0
        // );
        // Wait for the transaction to be mined
        // const secondTaskReceipt = await secondTask.wait();
        // console.log("Simple task created in tx:", secondTaskReceipt.hash);

    } catch (error) {
        console.error("Error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 