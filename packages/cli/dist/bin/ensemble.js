#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const dotenv_1 = require("dotenv");
const sdk_1 = require("../utils/sdk");
const formatters_1 = require("../utils/formatters");
const manager_1 = require("../config/manager");
// Load environment variables
(0, dotenv_1.config)();
const program = new commander_1.Command();
program
    .name('ensemble')
    .description('Ensemble CLI - Command-line interface for agent management')
    .version('0.1.0');
// Global options
program
    .option('--verbose', 'Enable verbose output')
    .option('--format <format>', 'Output format (table, json, csv, yaml)', 'yaml');
// Main agents command - fetch agent by address
program
    .command('agent <address>')
    .description('Get agent details by address')
    .action(async (address, options, command) => {
    try {
        const globalOptions = command.parent.opts();
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        console.log(chalk_1.default.blue(`🔍 Fetching agent ${address}...`));
        const agent = await agentService.getAgentRecord(address);
        console.log(chalk_1.default.green('✅ Agent found'));
        const output = (0, formatters_1.formatOutput)([agent], globalOptions.format, true);
        console.log(output);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error fetching agent:'));
        console.error(chalk_1.default.red(error.message));
        if (command.parent.opts().verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
// Agents command with list subcommand
const agentsCommand = program
    .command('agents')
    .description('Agent management commands');
agentsCommand
    .command('list')
    .description('List all agents with pagination')
    .option('--first <number>', 'Number of agents to fetch (default: 10)', parseInt, 10)
    .option('--skip <number>', 'Number of agents to skip (default: 0)', parseInt, 0)
    .action(async (options, command) => {
    try {
        const globalOptions = command.parent.parent.opts();
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        console.log(chalk_1.default.blue('🔍 Fetching agents...'));
        const agents = await agentService.getAgentRecords({
            first: options.first,
            skip: options.skip
        });
        if (agents.length === 0) {
            console.log(chalk_1.default.yellow('No agents found.'));
            return;
        }
        console.log(chalk_1.default.green(`✅ Found ${agents.length} agent(s)`));
        const output = (0, formatters_1.formatOutput)(agents, globalOptions.format, false);
        console.log(output);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error fetching agents:'));
        console.error(chalk_1.default.red(error.message));
        if (command.parent.parent.opts().verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
// Config command
program
    .command('config')
    .description('Show CLI configuration')
    .action(async (options, command) => {
    try {
        const globalOptions = command.parent.opts();
        const config = await (0, manager_1.getConfig)();
        // Remove sensitive information for display
        const displayConfig = { ...config };
        if (displayConfig.privateKey) {
            displayConfig.privateKey = '***HIDDEN***';
        }
        const output = (0, formatters_1.formatOutput)([displayConfig], globalOptions.format);
        console.log(output);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error reading configuration:'));
        console.error(chalk_1.default.red(error.message));
        if (command.parent.opts().verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
// Error handling
program.on('command:*', () => {
    console.error(chalk_1.default.red(`Unknown command: ${program.args.join(' ')}`));
    console.log('See --help for available commands.');
    process.exit(1);
});
// Parse arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=ensemble.js.map