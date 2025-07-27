"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSDKInstance = createSDKInstance;
exports.createSignerFromPrivateKey = createSignerFromPrivateKey;
const sdk_1 = require("@ensemble-ai/sdk");
const ethers_1 = require("ethers");
const manager_1 = require("../config/manager");
async function createSDKInstance() {
    const config = await (0, manager_1.getConfig)();
    // Create provider
    const provider = new ethers_1.ethers.JsonRpcProvider(config.rpcUrl);
    // Create signer if private key is available
    let signer;
    if (config.privateKey) {
        signer = new ethers_1.ethers.Wallet(config.privateKey, provider);
    }
    else {
        // Use a dummy signer for read-only operations
        signer = ethers_1.ethers.Wallet.createRandom().connect(provider);
    }
    // Create ensemble config
    const ensembleConfig = {
        taskRegistryAddress: config.contracts.taskRegistry,
        agentRegistryAddress: config.contracts.agentRegistry,
        serviceRegistryAddress: config.contracts.serviceRegistry,
        network: {
            chainId: config.network === 'mainnet' ? 8453 : 84532, // Base mainnet : Base Sepolia
            name: config.network,
            rpcUrl: config.rpcUrl
        },
        subgraphUrl: config.subgraphUrl
    };
    return sdk_1.Ensemble.create(ensembleConfig, signer);
}
function createSignerFromPrivateKey(privateKey, rpcUrl) {
    const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    return new ethers_1.ethers.Wallet(privateKey, provider);
}
//# sourceMappingURL=sdk.js.map