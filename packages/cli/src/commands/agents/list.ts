import { Command } from 'commander';
import chalk from 'chalk';
import { createSDKInstance } from '../../utils/sdk';
import { formatOutput } from '../../utils/formatters';
import { saveAgentRecords } from '../../utils/file-operations';
import { AgentFilterParams } from '@ensemble-ai/sdk';

export const listAgentsCommand = new Command('list')
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