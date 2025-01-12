import hardhat from "hardhat";
const { ethers } = hardhat;

async function deployContract(contractName) {
    const Factory = await ethers.getContractFactory(contractName);
    const contract = await Factory.deploy();
    await contract.deployed();
    console.log(`${contractName} deployed to: ${contract.address}`);
    console.log(`Transaction Hash: ${contract.deployTransaction.hash}`);
    return contract;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    await deployContract("AgentsRegistry");
    await deployContract("TaskRegistry");
    await deployContract("ServiceRegistry");
}

main()
    .then(() => {
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error("Error in deployment:", error);
        process.exitCode = 1;
    });
