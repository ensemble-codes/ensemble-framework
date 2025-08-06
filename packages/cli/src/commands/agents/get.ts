import { Command } from 'commander';
import chalk from 'chalk';
import { AgentService } from '@ensemble-ai/sdk';
import { createSDKInstance } from '../../utils/sdk';
import { formatOutput } from '../../utils/formatters';
import { saveAgentRecords } from '../../utils/file-operations';
import { AgentFilterParams } from '@ensemble-ai/sdk';

export const getAgentsCommand = new Command('get')
  .description('Get agents with filtering and output options')
  .argument('[address]', 'Agent address (optional - if provided, fetches specific agent)')
  .option('-h, --help', 'Display help information')
  .action(async (address?: string, options?: any) => {
    if (options?.help) {
      getAgentsCommand.outputHelp();
      return;
    }
    
    if (address) {
      // If an address is provided, fetch that specific agent
      try {
        const sdk = await createSDKInstance();
        const agentService = sdk.agents;

        console.log(chalk.blue(`🔍 Fetching agent ${address}...`));

        const agent = await agentService.getAgentRecord(address);

        console.log(chalk.green('✅ Agent found'));

        const output = formatOutput([agent], 'yaml', true);
        console.log(output);

      } catch (error: any) {
        console.error(chalk.red('❌ Error fetching agent:'));
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    } else {
      // No address provided, show help
      getAgentsCommand.outputHelp();
    }
  });

// Get multiple agents command
getAgentsCommand
  .command('agents')
  .description('List and discover agents with advanced filtering')
  .option('-h, --help', 'Display help information')
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
    if (options.help) {
      getAgentsCommand.command('agents').outputHelp();
      return;
    }
    
    try {
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      // Build filter parameters
      const filters: AgentFilterParams = {
        first: options.first,
        skip: options.skip
      };

      if (options.category) filters.category = options.category;
      if (options.owner) filters.owner = options.owner;
      if (options.name) filters.name = options.name;
      if (options.reputationMin !== undefined) filters.reputation_min = options.reputationMin;
      if (options.reputationMax !== undefined) filters.reputation_max = options.reputationMax;

      console.log(chalk.blue('🔍 Fetching agents...'));

      const agents = await agentService.getAgentRecords(filters);

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found matching the criteria.'));
        return;
      }

      console.log(chalk.green(`✅ Found ${agents.length} agent(s)`));

      // Format and display output
      const output = formatOutput(agents, options.format, options.includeMetadata);
      console.log(output);

      // Save records if requested
      if (options.saveRecords) {
        await saveAgentRecords(agents, options.saveRecords, options.saveRecordsPrefix);
        console.log(chalk.green(`💾 Saved ${agents.length} agent records to ${options.saveRecords}`));
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Error fetching agents:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Get single agent command
getAgentsCommand
  .command('agent <agent-address>')
  .description('Get detailed information about a specific agent')
  .option('-h, --help', 'Display help information')
  .option('--format <format>', 'Output format (table, json, yaml)', 'yaml')
  .option('--include-proposals', 'Include agent\'s service proposals')
  .option('--include-history', 'Include recent task history')
  .option('--include-ratings', 'Include reputation breakdown')
  .option('--save-record <file>', 'Save agent data as agent-record.yaml file')
  .action(async (agentAddress: string, options) => {
    if (options.help) {
      getAgentsCommand.command('agent').outputHelp();
      return;
    }
    
    try {
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      console.log(chalk.blue(`🔍 Fetching agent ${agentAddress}...`));

      const agent = await agentService.getAgentRecord(agentAddress);

      console.log(chalk.green('✅ Agent found'));

      // Format and display output
      const output = formatOutput([agent], options.format, true);
      console.log(output);

      // Save record if requested
      if (options.saveRecord) {
        await saveAgentRecords([agent], '.', options.saveRecord);
        console.log(chalk.green(`💾 Saved agent record to ${options.saveRecord}`));
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Error fetching agent:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Get agent categories command
getAgentsCommand
  .command('categories')
  .description('Retrieve available agent categories')
  .option('-h, --help', 'Display help information')
  .option('--format <format>', 'Output format (table, json, csv)', 'table')
  .action(async (options) => {
    if (options.help) {
      getAgentsCommand.command('categories').outputHelp();
      return;
    }
    
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

      console.log(chalk.green(`✅ Found ${categories.length} categories`));

      const output = formatOutput(categories, options.format);
      console.log(output);

    } catch (error: any) {
      console.error(chalk.red('❌ Error fetching categories:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });