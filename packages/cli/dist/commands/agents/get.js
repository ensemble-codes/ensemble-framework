"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentsCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../../utils/sdk");
const formatters_1 = require("../../utils/formatters");
const file_operations_1 = require("../../utils/file-operations");
exports.getAgentsCommand = new commander_1.Command('get')
    .description('Get agents with filtering and output options');
// Get multiple agents command
exports.getAgentsCommand
    .command('agents')
    .description('List and discover agents with advanced filtering')
    .option('--category <category>', 'Filter by agent category')
    .option('--owner <address>', 'Filter by owner address')
    .option('--status <status>', 'Filter by agent status (active, inactive, maintenance)')
    .option('--reputation-min <score>', 'Filter by minimum reputation score', parseFloat)
    .option('--reputation-max <score>', 'Filter by maximum reputation score', parseFloat)
    .option('--name <name>', 'Search by agent name (case-insensitive)')
    .option('--attributes <tags>', 'Filter by attributes/tags (comma-separated)')
    .option('--first <number>', 'Limit number of results (default: 10)', parseInt, 10)
    .option('--skip <number>', 'Skip number of results for pagination (default: 0)', parseInt, 0)
    .option('--sort-by <field>', 'Sort by field (reputation, name, created, updated)', 'reputation')
    .option('--sort-order <order>', 'Sort order (asc, desc) (default: desc)', 'desc')
    .option('--format <format>', 'Output format (table, json, csv, yaml)', 'table')
    .option('--include-metadata', 'Include full metadata in output')
    .option('--save-records <directory>', 'Save each agent as agent-record.yaml file in specified directory')
    .option('--save-records-prefix <prefix>', 'Prefix for saved agent-record files (default: agent-record)', 'agent-record')
    .action(async (options) => {
    try {
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        // Build filter parameters
        const filters = {
            first: options.first,
            skip: options.skip
        };
        if (options.category)
            filters.category = options.category;
        if (options.owner)
            filters.owner = options.owner;
        if (options.name)
            filters.name = options.name;
        if (options.reputationMin !== undefined)
            filters.reputation_min = options.reputationMin;
        if (options.reputationMax !== undefined)
            filters.reputation_max = options.reputationMax;
        console.log(chalk_1.default.blue('🔍 Fetching agents...'));
        const agents = await agentService.getAgentRecords(filters);
        if (agents.length === 0) {
            console.log(chalk_1.default.yellow('No agents found matching the criteria.'));
            return;
        }
        console.log(chalk_1.default.green(`✅ Found ${agents.length} agent(s)`));
        // Format and display output
        const output = (0, formatters_1.formatOutput)(agents, options.format, options.includeMetadata);
        console.log(output);
        // Save records if requested
        if (options.saveRecords) {
            await (0, file_operations_1.saveAgentRecords)(agents, options.saveRecords, options.saveRecordsPrefix);
            console.log(chalk_1.default.green(`💾 Saved ${agents.length} agent records to ${options.saveRecords}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error fetching agents:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
// Get single agent command
exports.getAgentsCommand
    .command('agent <agent-address>')
    .description('Get detailed information about a specific agent')
    .option('--format <format>', 'Output format (table, json, yaml)', 'table')
    .option('--include-proposals', 'Include agent\'s service proposals')
    .option('--include-history', 'Include recent task history')
    .option('--include-ratings', 'Include reputation breakdown')
    .option('--save-record <file>', 'Save agent data as agent-record.yaml file')
    .action(async (agentAddress, options) => {
    try {
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        console.log(chalk_1.default.blue(`🔍 Fetching agent ${agentAddress}...`));
        const agent = await agentService.getAgentRecord(agentAddress);
        console.log(chalk_1.default.green('✅ Agent found'));
        // Format and display output
        const output = (0, formatters_1.formatOutput)([agent], options.format, true);
        console.log(output);
        // Save record if requested
        if (options.saveRecord) {
            await (0, file_operations_1.saveAgentRecords)([agent], '.', options.saveRecord);
            console.log(chalk_1.default.green(`💾 Saved agent record to ${options.saveRecord}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error fetching agent:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
// Get agent categories command
exports.getAgentsCommand
    .command('categories')
    .description('Retrieve available agent categories')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .action(async (options) => {
    try {
        // For now, return common categories. This could be extended to query from subgraph
        const categories = [
            { name: 'ai-assistant', description: 'General AI assistants' },
            { name: 'chatbot', description: 'Conversational bots' },
            { name: 'service', description: 'Service-oriented agents' },
            { name: 'data-analysis', description: 'Data analysis specialists' },
            { name: 'trading', description: 'Trading and financial agents' },
            { name: 'content-creation', description: 'Content generation agents' },
            { name: 'automation', description: 'Task automation agents' }
        ];
        console.log(chalk_1.default.green(`✅ Found ${categories.length} categories`));
        const output = (0, formatters_1.formatOutput)(categories, options.format);
        console.log(output);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error fetching categories:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
//# sourceMappingURL=get.js.map