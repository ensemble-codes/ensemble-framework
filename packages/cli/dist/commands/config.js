"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const manager_1 = require("../config/manager");
const formatters_1 = require("../utils/formatters");
exports.configCommand = new commander_1.Command('config')
    .description('Manage CLI configuration and network settings');
exports.configCommand
    .command('show')
    .description('Display current configuration')
    .option('--format <format>', 'Output format (table, json, yaml)', 'table')
    .action(async (options) => {
    try {
        const config = await (0, manager_1.getConfig)();
        // Remove sensitive information for display
        const displayConfig = { ...config };
        if (displayConfig.privateKey) {
            displayConfig.privateKey = '***HIDDEN***';
        }
        const output = (0, formatters_1.formatOutput)([displayConfig], options.format);
        console.log(output);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error reading configuration:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
exports.configCommand
    .command('set-network <network>')
    .description('Set default network (mainnet, sepolia)')
    .action(async (network) => {
    try {
        if (!['mainnet', 'sepolia'].includes(network)) {
            console.error(chalk_1.default.red('❌ Invalid network. Use: mainnet or sepolia'));
            process.exit(1);
        }
        const rpcUrl = network === 'mainnet'
            ? 'https://mainnet.base.org'
            : 'https://sepolia.base.org';
        await (0, manager_1.updateConfig)({ network, rpcUrl });
        console.log(chalk_1.default.green(`✅ Network set to ${network}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error updating configuration:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
exports.configCommand
    .command('set-rpc <url>')
    .description('Set custom RPC endpoint')
    .action(async (url) => {
    try {
        await (0, manager_1.updateConfig)({ rpcUrl: url });
        console.log(chalk_1.default.green(`✅ RPC URL set to ${url}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error updating configuration:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
exports.configCommand
    .command('set-private-key <key>')
    .description('Set default private key (stored securely)')
    .action(async (key) => {
    try {
        await (0, manager_1.updateConfig)({ privateKey: key });
        console.log(chalk_1.default.green('✅ Private key set successfully'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error updating configuration:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
exports.configCommand
    .command('set-gas-price <price>')
    .description('Set default gas price (gwei)')
    .action(async (price) => {
    try {
        await (0, manager_1.updateConfig)({ gasPrice: price });
        console.log(chalk_1.default.green(`✅ Gas price set to ${price} gwei`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error updating configuration:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
exports.configCommand
    .command('reset')
    .description('Reset to default configuration')
    .action(async () => {
    try {
        await (0, manager_1.resetConfig)();
        console.log(chalk_1.default.green('✅ Configuration reset to defaults'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error resetting configuration:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
//# sourceMappingURL=config.js.map