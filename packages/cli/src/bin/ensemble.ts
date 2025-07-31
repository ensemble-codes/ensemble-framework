#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { createSDKInstance } from '../utils/sdk';
import { formatOutput } from '../utils/formatters';
import { getConfig } from '../config/manager';
import { walletCommand } from '../commands/wallet';
import { agentsCommand } from '../commands/agents';

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
  .option('--format <format>', 'Output format (table, json, csv, yaml)', 'yaml')
  .option('--wallet <name>', 'Override active wallet for this command');

// Main agents command - fetch agent by address
program
  .command('agent <address>')
  .description('Get agent details by address')
  .action(async (address: string, _options, command) => {
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

// Add agents command
program.addCommand(agentsCommand);

// Config command
program
  .command('config')
  .description('Show CLI configuration')
  .action(async (_options, command) => {
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

// Add wallet command
program.addCommand(walletCommand);

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