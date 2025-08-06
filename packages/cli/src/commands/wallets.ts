import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { WalletService } from '../services/WalletService';
import { getConfig, setActiveWallet, getActiveWallet, clearActiveWallet } from '../config/manager';
import { formatOutput } from '../utils/formatters';
import { getEffectiveWallet } from '../utils/wallet';
import { 
  WalletError,
  WalletNotFoundError,
  WalletAlreadyExistsError,
  InvalidPasswordError,
  InvalidMnemonicError,
  InvalidPrivateKeyError
} from '../types/wallet';

async function getWalletService(): Promise<WalletService> {
  const config = await getConfig();
  return new WalletService(config.rpcUrl);
}

function handleWalletError(error: any, verbose: boolean = false): void {
  if (error instanceof WalletNotFoundError) {
    console.error(chalk.red(`❌ ${error.message}`));
  } else if (error instanceof WalletAlreadyExistsError) {
    console.error(chalk.red(`❌ ${error.message}`));
    console.error(chalk.yellow('💡 Use a different name or delete the existing wallet first'));
  } else if (error instanceof InvalidPasswordError) {
    console.error(chalk.red('❌ Invalid password'));
  } else if (error instanceof InvalidMnemonicError) {
    console.error(chalk.red('❌ Invalid mnemonic phrase'));
    console.error(chalk.yellow('💡 Please check your mnemonic phrase and try again'));
  } else if (error instanceof InvalidPrivateKeyError) {
    console.error(chalk.red('❌ Invalid private key'));
    console.error(chalk.yellow('💡 Private key must be a valid hex string'));
  } else if (error instanceof WalletError) {
    console.error(chalk.red(`❌ ${error.message}`));
  } else {
    console.error(chalk.red('❌ Unexpected error:'));
    console.error(chalk.red(error.message));
    if (verbose) {
      console.error(error.stack);
    }
  }
}

async function promptPassword(message: string = 'Enter password:', confirm: boolean = false): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message,
      mask: '*',
      validate: (input: string) => {
        if (input.length < 8) {
          return 'Password must be at least 8 characters long';
        }
        return true;
      }
    }
  ]);

  if (confirm) {
    await inquirer.prompt([
      {
        type: 'password',
        name: 'confirmPassword',
        message: 'Confirm password:',
        mask: '*',
        validate: (input: string) => {
          if (input !== password) {
            return 'Passwords do not match';
          }
          return true;
        }
      }
    ]);
  }

  return password;
}

export const walletCommand = new Command('wallets')
  .description('Wallet management commands');

// Create wallet command
walletCommand
  .command('create [name]')
  .description('Create a new wallet')
  .option('--type <type>', 'Wallet type (mnemonic, private-key)', 'mnemonic')
  .action(async (name: string | undefined, options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const walletService = await getWalletService();

      // Prompt for wallet name if not provided
      if (!name) {
        const { walletName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'walletName',
            message: 'Enter wallet name:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Wallet name is required';
              }
              if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
                return 'Wallet name can only contain letters, numbers, underscores, and hyphens';
              }
              return true;
            }
          }
        ]);
        name = walletName;
      }

      // Validate type
      if (!['mnemonic', 'private-key'].includes(options.type)) {
        console.error(chalk.red('❌ Invalid wallet type. Must be "mnemonic" or "private-key"'));
        process.exit(1);
      }

      // Prompt for password
      const password = await promptPassword('Enter password for new wallet:', true);

      const spinner = ora('Creating wallet...').start();

      try {
        const result = await walletService.createWallet({
          name: name!,
          password,
          type: options.type
        });

        spinner.succeed('Wallet created successfully');

        console.log(chalk.green('✅ Wallet created successfully'));
        console.log(chalk.blue(`📛 Name: ${name}`));
        console.log(chalk.blue(`📍 Address: ${result.address}`));
        
        if (result.mnemonic) {
          console.log(chalk.yellow('\n🔐 IMPORTANT: Save your mnemonic phrase in a safe place!'));
          console.log(chalk.yellow('This is the only time it will be displayed.'));
          console.log(chalk.cyan(`\nMnemonic: ${result.mnemonic}`));
        }

      } catch (error: any) {
        spinner.fail('Failed to create wallet');
        handleWalletError(error, globalOptions.verbose);
        process.exit(1);
      }

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// Import wallet command
walletCommand
  .command('import [name]')
  .description('Import an existing wallet')
  .option('--mnemonic', 'Import from mnemonic phrase')
  .option('--private-key', 'Import from private key')
  .option('--keystore <file>', 'Import from keystore file')
  .action(async (name: string | undefined, options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const walletService = await getWalletService();

      // Prompt for wallet name if not provided
      if (!name) {
        const { walletName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'walletName',
            message: 'Enter wallet name:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Wallet name is required';
              }
              if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
                return 'Wallet name can only contain letters, numbers, underscores, and hyphens';
              }
              return true;
            }
          }
        ]);
        name = walletName;
      }

      // Determine import method
      let importMethod: 'mnemonic' | 'private-key' | 'keystore';
      if (options.mnemonic) {
        importMethod = 'mnemonic';
      } else if (options.privateKey) {
        importMethod = 'private-key';
      } else if (options.keystore) {
        importMethod = 'keystore';
      } else {
        const { method } = await inquirer.prompt([
          {
            type: 'list',
            name: 'method',
            message: 'Select import method:',
            choices: [
              { name: 'Mnemonic phrase', value: 'mnemonic' },
              { name: 'Private key', value: 'private-key' },
              { name: 'Keystore file', value: 'keystore' }
            ]
          }
        ]);
        importMethod = method;
      }

      // Collect import data
      let importData: any = {};

      if (importMethod === 'mnemonic') {
        const { mnemonic } = await inquirer.prompt([
          {
            type: 'input',
            name: 'mnemonic',
            message: 'Enter mnemonic phrase:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Mnemonic phrase is required';
              }
              return true;
            }
          }
        ]);
        importData.mnemonic = mnemonic;
      } else if (importMethod === 'private-key') {
        const { privateKey } = await inquirer.prompt([
          {
            type: 'password',
            name: 'privateKey',
            message: 'Enter private key:',
            mask: '*',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Private key is required';
              }
              return true;
            }
          }
        ]);
        importData.privateKey = privateKey;
      } else if (importMethod === 'keystore') {
        // TODO: Implement keystore file reading
        console.error(chalk.red('❌ Keystore import not yet implemented'));
        process.exit(1);
      }

      // Prompt for password
      const password = await promptPassword('Enter password for wallet:', true);

      const spinner = ora('Importing wallet...').start();

      try {
        const result = await walletService.importWallet({
          name: name!,
          password,
          ...importData
        });

        spinner.succeed('Wallet imported successfully');

        console.log(chalk.green('✅ Wallet imported successfully'));
        console.log(chalk.blue(`📛 Name: ${name}`));
        console.log(chalk.blue(`📍 Address: ${result.address}`));

      } catch (error: any) {
        spinner.fail('Failed to import wallet');
        handleWalletError(error, globalOptions.verbose);
        process.exit(1);
      }

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// List wallets command
walletCommand
  .command('list')
  .description('List all wallets')
  .action(async (_options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const walletService = await getWalletService();
      const activeWallet = await getActiveWallet();

      const wallets = await walletService.listWallets();

      if (wallets.length === 0) {
        console.log(chalk.yellow('No wallets found.'));
        console.log(chalk.blue('💡 Create a new wallet with: ensemble wallets create'));
        return;
      }

      console.log(chalk.green(`✅ Found ${wallets.length} wallet(s)`));
      
      if (activeWallet) {
        console.log(chalk.blue(`🎯 Active wallet: ${activeWallet}`));
      } else {
        console.log(chalk.yellow('⚠️  No active wallet set'));
      }

      // Add active indicator to wallet data for formatting
      const walletsWithActiveIndicator = wallets.map(wallet => ({
        ...wallet,
        active: wallet.name === activeWallet ? '✅' : '',
        name: wallet.name === activeWallet ? `${wallet.name} (active)` : wallet.name
      }));

      const output = formatOutput(walletsWithActiveIndicator, globalOptions.format);
      console.log(output);

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// Get balance command
walletCommand
  .command('balance [wallet]')
  .description('Check wallet balance (uses active wallet if none specified)')
  .action(async (wallet: string | undefined, _options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const walletService = await getWalletService();

      // Get effective wallet (command arg > global option > active wallet)
      let targetWallet = wallet || await getEffectiveWallet(globalOptions.wallet);
      if (!targetWallet) {
        console.error(chalk.red('❌ No wallet specified and no active wallet set'));
        console.error(chalk.yellow('💡 Use --wallet <name>, set an active wallet with "ensemble wallets use <name>", or specify a wallet: ensemble wallets balance <name>'));
        process.exit(1);
      }
      
      if (!wallet && targetWallet) {
        console.log(chalk.blue(`Using ${globalOptions.wallet ? 'global' : 'active'} wallet: ${targetWallet}`));
      }

      const spinner = ora('Fetching balance...').start();

      try {
        const balance = await walletService.getBalance(targetWallet);
        spinner.succeed('Balance retrieved');

        console.log(chalk.green('✅ Wallet balance'));
        console.log(chalk.blue(`📛 Name: ${targetWallet}`));
        console.log(chalk.blue(`📍 Address: ${balance.address}`));
        console.log(chalk.blue(`💰 ETH: ${balance.eth}`));
        
        if (balance.tokens.length > 0) {
          console.log(chalk.blue('🪙 Tokens:'));
          balance.tokens.forEach(token => {
            console.log(chalk.blue(`  • ${token.symbol}: ${token.balance}`));
          });
        }

      } catch (error: any) {
        spinner.fail('Failed to fetch balance');
        handleWalletError(error, globalOptions.verbose);
        process.exit(1);
      }

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// Export wallet command
walletCommand
  .command('export <name>')
  .description('Export wallet data')
  .option('--format <format>', 'Export format (mnemonic, private-key, keystore)', 'mnemonic')
  .action(async (name: string, options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const walletService = await getWalletService();

      // Validate format
      if (!['mnemonic', 'private-key', 'keystore'].includes(options.format)) {
        console.error(chalk.red('❌ Invalid export format. Must be "mnemonic", "private-key", or "keystore"'));
        process.exit(1);
      }

      // Prompt for password
      const password = await promptPassword('Enter wallet password:');
      
      let outputPassword: string | undefined;
      if (options.format === 'keystore') {
        outputPassword = await promptPassword('Enter password for keystore file:', true);
      }

      const spinner = ora('Exporting wallet...').start();

      try {
        const exportedData = await walletService.exportWallet({
          name,
          password,
          format: options.format,
          outputPassword
        });

        spinner.succeed('Wallet exported successfully');

        console.log(chalk.yellow('\n🔐 SENSITIVE DATA - Handle with care!'));
        console.log(chalk.cyan(`\n${options.format.toUpperCase()}:`));
        console.log(exportedData);

      } catch (error: any) {
        spinner.fail('Failed to export wallet');
        handleWalletError(error, globalOptions.verbose);
        process.exit(1);
      }

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// Use wallet command - set active wallet
walletCommand
  .command('use <name>')
  .description('Set the active wallet for CLI operations')
  .action(async (name: string, _options, command) => {
    try {
      const walletService = await getWalletService();

      // Verify wallet exists
      try {
        await walletService.getWalletAddress(name);
      } catch (error) {
        if (error instanceof WalletNotFoundError) {
          console.error(chalk.red(`❌ Wallet '${name}' not found`));
          console.error(chalk.yellow('💡 Use "ensemble wallets list" to see available wallets'));
          process.exit(1);
        }
        throw error;
      }

      // Set as active wallet
      await setActiveWallet(name);

      console.log(chalk.green(`✅ Active wallet set to '${name}'`));
      
      const address = await walletService.getWalletAddress(name);
      console.log(chalk.blue(`📍 Address: ${address}`));

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// Current wallet command - show active wallet
walletCommand
  .command('current')
  .description('Show the currently active wallet')
  .action(async (_options, command) => {
    try {
      const activeWallet = await getActiveWallet();

      if (!activeWallet) {
        console.log(chalk.yellow('No active wallet set'));
        console.log(chalk.blue('💡 Use "ensemble wallets use <name>" to set an active wallet'));
        return;
      }

      const walletService = await getWalletService();
      
      try {
        const address = await walletService.getWalletAddress(activeWallet);
        
        console.log(chalk.green('✅ Current active wallet'));
        console.log(chalk.blue(`📛 Name: ${activeWallet}`));
        console.log(chalk.blue(`📍 Address: ${address}`));
      } catch (error) {
        if (error instanceof WalletNotFoundError) {
          console.error(chalk.red(`❌ Active wallet '${activeWallet}' not found`));
          console.error(chalk.yellow('💡 The wallet may have been deleted. Use "ensemble wallets use <name>" to set a new active wallet'));
          
          // Clear the invalid active wallet
          await clearActiveWallet();
          process.exit(1);
        }
        throw error;
      }

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });

// Delete wallet command
walletCommand
  .command('delete <name>')
  .description('Delete a wallet')
  .action(async (name: string, _options, command) => {
    try {
      const globalOptions = command.parent.parent.opts();
      const walletService = await getWalletService();

      // Confirmation prompt
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.yellow(`⚠️  Are you sure you want to delete wallet '${name}'? This action cannot be undone.`),
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.blue('💭 Wallet deletion cancelled'));
        return;
      }

      // Prompt for password to verify ownership
      const password = await promptPassword('Enter wallet password to confirm deletion:');

      const spinner = ora('Deleting wallet...').start();

      try {
        await walletService.deleteWallet(name, password);
        
        // Check if we're deleting the active wallet
        const activeWallet = await getActiveWallet();
        if (activeWallet === name) {
          await clearActiveWallet();
          console.log(chalk.yellow(`💡 '${name}' was the active wallet and has been cleared`));
        }
        
        spinner.succeed('Wallet deleted successfully');

        console.log(chalk.green('✅ Wallet deleted successfully'));
        console.log(chalk.yellow('💡 Make sure you have backed up your wallet before deletion'));

      } catch (error: any) {
        spinner.fail('Failed to delete wallet');
        handleWalletError(error, globalOptions.verbose);
        process.exit(1);
      }

    } catch (error: any) {
      handleWalletError(error, command.parent.parent.opts().verbose);
      process.exit(1);
    }
  });