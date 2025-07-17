#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import types
// import { GlobalOptions } from './types';

// Version information
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

// Check for updates
updateNotifier({ pkg: packageJson }).notify();

// Create the main command
const program = new Command();

program
  .name('ensemble')
  .description('Command-line interface for the Ensemble AI framework')
  .version(version, '-v, --version', 'Display version information')
  .option('--network <network>', 'Network to use (overrides config)')
  .option('--wallet <wallet>', 'Wallet to use (overrides config)')
  .option('--config <file>', 'Configuration file path')
  .option('--verbose', 'Enable verbose output')
  .option('--quiet', 'Suppress non-essential output')
  .option('--dry-run', 'Show what would be done without executing')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ensemble agent register --interactive
  $ ensemble task create --prompt "Generate a tweet" --proposal 123
  $ ensemble config set defaultNetwork base-sepolia
  $ ensemble wallet create myWallet
  $ ensemble listen --tasks

For more information, visit: https://docs.ensemble.ai
`)
  .showHelpAfterError()
  .configureHelp({
    sortSubcommands: true,
    showGlobalOptions: true,
  });

// Global error handler
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled promise rejection:'));
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'));
  console.error(error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nGracefully shutting down...'));
  process.exit(0);
});

// Parse arguments and run
async function main() {
  try {
    // TODO: Add command imports and registration here
    // For now, just show a basic message
    if (process.argv.length === 2) {
      program.outputHelp();
      return;
    }
    
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

export default program;