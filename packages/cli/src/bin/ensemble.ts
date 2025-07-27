#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { createSDKInstance } from '../utils/sdk';
import { formatOutput } from '../utils/formatters';
import { getConfig } from '../config/manager';

// Load environment variables
config();

const program = new Command();

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
  .action(async (address: string, options, command) => {
    try {
      const globalOptions = command.parent.opts();
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      console.log(chalk.blue(`🔍 Fetching agent ${address}...`));

      const agent = await agentService.getAgentRecord(address);

      console.log(chalk.green('✅ Agent found'));

      const output = formatOutput([agent], globalOptions.format, true);
      console.log(output);

    } catch (error: any) {
      console.error(chalk.red('❌ Error fetching agent:'));
      console.error(chalk.red(error.message));
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
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      console.log(chalk.blue('🔍 Fetching agents...'));

      const agents = await agentService.getAgentRecords({
        first: options.first,
        skip: options.skip
      });

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found.'));
        return;
      }

      console.log(chalk.green(`✅ Found ${agents.length} agent(s)`));

      const output = formatOutput(agents, globalOptions.format, false);
      console.log(output);

    } catch (error: any) {
      console.error(chalk.red('❌ Error fetching agents:'));
      console.error(chalk.red(error.message));
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
      const config = await getConfig();
      
      // Remove sensitive information for display
      const displayConfig = { ...config };
      if (displayConfig.privateKey) {
        displayConfig.privateKey = '***HIDDEN***';
      }
      
      const output = formatOutput([displayConfig], globalOptions.format);
      console.log(output);
    } catch (error: any) {
      console.error(chalk.red('❌ Error reading configuration:'));
      console.error(chalk.red(error.message));
      if (command.parent.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`));
  console.log('See --help for available commands.');
  process.exit(1);
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}