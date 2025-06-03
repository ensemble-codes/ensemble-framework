const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying EnsembleCredits with the account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deployment parameters
    const TOKEN_NAME = "Ensemble Credits";
    const TOKEN_SYMBOL = "EC";
    const INITIAL_ADMIN = deployer.address; // Can be changed to a different address if needed
    const INITIAL_SUPPLY = 0; // Set to 0 for no initial supply, or specify amount (in 6 decimals)

    // Deploy the contract
    const EnsembleCredits = await ethers.getContractFactory("EnsembleCredits");
    const ensembleCredits = await EnsembleCredits.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        INITIAL_ADMIN,
        INITIAL_SUPPLY
    );

    await ensembleCredits.waitForDeployment();

    console.log("EnsembleCredits deployed to:", await ensembleCredits.getAddress());
    console.log("Token name:", await ensembleCredits.name());
    console.log("Token symbol:", await ensembleCredits.symbol());
    console.log("Decimals:", await ensembleCredits.decimals());
    console.log("Initial admin:", INITIAL_ADMIN);
    console.log("Initial supply:", INITIAL_SUPPLY);
    console.log("Total supply:", (await ensembleCredits.totalSupply()).toString());

    // Verify deployer has correct roles
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    
    console.log("Deployer has admin role:", await ensembleCredits.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
    console.log("Deployer has minter role:", await ensembleCredits.hasRole(MINTER_ROLE, deployer.address));

    console.log("\nDeployment completed successfully!");
    console.log("\nContract address for verification:");
    console.log(await ensembleCredits.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 