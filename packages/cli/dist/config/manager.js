"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.updateConfig = updateConfig;
exports.resetConfig = resetConfig;
exports.getConfigWithEnvOverrides = getConfigWithEnvOverrides;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.ensemble');
const CONFIG_FILE = (0, path_1.join)(CONFIG_DIR, 'config.json');
const DEFAULT_CONFIG = {
    network: 'sepolia',
    rpcUrl: 'https://sepolia.base.org',
    gasPrice: '20',
    outputFormat: 'yaml',
    contracts: {
        agentRegistry: '0xDbF645cC23066cc364C4Db915c78135eE52f11B2',
        taskRegistry: '0x847fA49b999489fD2780fe2843A7b1608106b49b',
        serviceRegistry: '0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244'
    },
    subgraphUrl: 'https://api.studio.thegraph.com/query/89266/ensemble-base-sepolia/version/latest'
};
async function getConfig() {
    try {
        if (!(0, fs_1.existsSync)(CONFIG_FILE)) {
            await saveConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
        const configData = await (0, promises_1.readFile)(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(configData);
        // Merge with defaults to ensure all fields are present
        return { ...DEFAULT_CONFIG, ...config };
    }
    catch (error) {
        console.warn('Error reading config, using defaults:', error);
        return DEFAULT_CONFIG;
    }
}
async function saveConfig(config) {
    try {
        // Ensure config directory exists
        if (!(0, fs_1.existsSync)(CONFIG_DIR)) {
            await (0, promises_1.mkdir)(CONFIG_DIR, { recursive: true });
        }
        await (0, promises_1.writeFile)(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    catch (error) {
        throw new Error(`Failed to save config: ${error}`);
    }
}
async function updateConfig(updates) {
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...updates };
    await saveConfig(newConfig);
    return newConfig;
}
async function resetConfig() {
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
}
// Environment variable overrides
function getConfigWithEnvOverrides() {
    return getConfig().then(config => ({
        ...config,
        network: process.env.ENSEMBLE_NETWORK || config.network,
        rpcUrl: process.env.ENSEMBLE_RPC_URL || config.rpcUrl,
        privateKey: process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey,
        gasPrice: process.env.ENSEMBLE_GAS_PRICE || config.gasPrice,
        outputFormat: process.env.ENSEMBLE_OUTPUT_FORMAT || config.outputFormat
    }));
}
//# sourceMappingURL=manager.js.map