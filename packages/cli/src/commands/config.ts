import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, updateConfig, resetConfig } from '../config/manager';
import { formatOutput } from '../utils/formatters';

export const configCommand = new Command('config')
  .description('Manage CLI configuration and network settings');

configCommand
  .command('show')
  .description('Display current configuration')
  .option('--format <format>', 'Output format (table, json, yaml)', 'table')
  .action(async (options) => {
    try {
      const config = await getConfig();
      
      // Remove sensitive information for display
      const displayConfig = { ...config };
      if (displayConfig.privateKey) {
        displayConfig.privateKey = '***HIDDEN***';
      }
      
      const output = formatOutput([displayConfig], options.format);
      console.log(output);
    } catch (error: any) {
      console.error(chalk.red('❌ Error reading configuration:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

configCommand
  .command('set-network <network>')
  .description('Set default network (mainnet, sepolia)')
  .action(async (network: 'mainnet' | 'sepolia') => {
    try {
      if (!['mainnet', 'sepolia'].includes(network)) {
        console.error(chalk.red('❌ Invalid network. Use: mainnet or sepolia'));
        process.exit(1);
      }
      
      const rpcUrl = network === 'mainnet' 
        ? 'https://mainnet.base.org'
        : 'https://sepolia.base.org';
      
      await updateConfig({ network, rpcUrl });
      console.log(chalk.green(`✅ Network set to ${network}`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error updating configuration:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

configCommand
  .command('set-rpc <url>')
  .description('Set custom RPC endpoint')
  .action(async (url: string) => {
    try {
      await updateConfig({ rpcUrl: url });
      console.log(chalk.green(`✅ RPC URL set to ${url}`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error updating configuration:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

configCommand
  .command('set-private-key <key>')
  .description('Set default private key (stored securely)')
  .action(async (key: string) => {
    try {
      await updateConfig({ privateKey: key });
      console.log(chalk.green('✅ Private key set successfully'));
    } catch (error: any) {
      console.error(chalk.red('❌ Error updating configuration:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

configCommand
  .command('set-gas-price <price>')
  .description('Set default gas price (gwei)')
  .action(async (price: string) => {
    try {
      await updateConfig({ gasPrice: price });
      console.log(chalk.green(`✅ Gas price set to ${price} gwei`));
    } catch (error: any) {
      console.error(chalk.red('❌ Error updating configuration:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

configCommand
  .command('reset')
  .description('Reset to default configuration')
  .action(async () => {
    try {
      await resetConfig();
      console.log(chalk.green('✅ Configuration reset to defaults'));
    } catch (error: any) {
      console.error(chalk.red('❌ Error resetting configuration:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });