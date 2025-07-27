#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { createSDKInstance } from '../utils/sdk';
import { formatOutput } from '../utils/formatters';
import { getConfig, getActiveWallet } from '../config/manager';
import { walletCommand } from '../commands/wallet';
import { WalletService } from '../services/WalletService';
import { getEffectiveWallet } from '../utils/wallet';

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

// Agents command with list subcommand
const agentsCommand = program
  .command('agents')
  .description('Agent management commands');

agentsCommand
  .command('list')
  .description('List all agents with pagination and filtering')
  .option('--first <number>', 'Number of agents to fetch (default: 10)', parseInt, 10)
  .option('--skip <number>', 'Number of agents to skip (default: 0)', parseInt, 0)
  .option('--owner <address>', 'Filter agents by owner address')
  .option('--mine', 'Filter agents owned by the connected wallet')
  .action(async (options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      // Handle --mine flag
      let ownerAddress = options.owner;
      
      if (options.mine) {
        if (options.owner) {
          console.error(chalk.red('❌ Cannot use both --mine and --owner flags together'));
          process.exit(1);
        }
        
        // Get the effective wallet
        const effectiveWallet = await getEffectiveWallet(globalOptions.wallet);
        if (!effectiveWallet) {
          console.error(chalk.red('❌ No wallet specified and no active wallet set'));
          console.error(chalk.yellow('💡 Use --wallet <name>, set an active wallet with "ensemble wallet use <name>", or use --owner <address>'));
          process.exit(1);
        }
        
        // Get wallet address
        const config = await getConfig();
        const walletService = new WalletService(config.rpcUrl);
        try {
          ownerAddress = await walletService.getWalletAddress(effectiveWallet);
          console.log(chalk.blue(`🔍 Fetching agents for wallet '${effectiveWallet}' (${ownerAddress})...`));
        } catch (error) {
          console.error(chalk.red(`❌ Wallet '${effectiveWallet}' not found`));
          process.exit(1);
        }
      } else if (ownerAddress) {
        // Validate owner address if provided
        if (!/^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
          console.error(chalk.red('❌ Invalid owner address format. Must be a valid Ethereum address.'));
          process.exit(1);
        }
        console.log(chalk.blue(`🔍 Fetching agents for owner ${ownerAddress}...`));
      } else {
        console.log(chalk.blue('🔍 Fetching agents...'));
      }

      const filterParams: any = {
        first: options.first,
        skip: options.skip
      };

      if (ownerAddress) {
        filterParams.owner = ownerAddress;
      }

      const agents = await agentService.getAgentRecords(filterParams);

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