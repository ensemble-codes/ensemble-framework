import { Command } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { parse as yamlParse } from 'yaml';
import inquirer from 'inquirer';
import ora from 'ora';
import { createSDKInstance, createSignerFromPrivateKey } from '../../utils/sdk';
import { validateAgentRecordYAML } from '../../utils/validation';
import { getConfig } from '../../config/manager';
import { AgentRecordYAML } from '../../types/config';
import { WalletService } from '../../services/WalletService';
import { getEffectiveWallet } from '../../utils/wallet';

export const updateAgentCommand = new Command('update')
  .description('Update agent record with multiple properties or from a config file')
  .argument('[agent-address]', 'Agent address to update')
  .option('-h, --help', 'Display help information')
  .option('--name <name>', 'Update agent name')
  .option('--description <description>', 'Update agent description')
  .option('--category <category>', 'Update agent category')
  .option('--attributes <tags>', 'Update attributes (comma-separated)')
  .option('--instructions <file>', 'Update instructions from file')
  .option('--prompts <file>', 'Update prompts from file')
  .option('--image-uri <uri>', 'Update agent image URI')
  .option('--status <status>', 'Update agent status')
  .option('--communication-type <type>', 'Update communication type')
  .option('--communication-url <url>', 'Update communication URL')
  .option('--twitter <handle>', 'Update Twitter handle')
  .option('--telegram <handle>', 'Update Telegram handle')
  .option('--github <username>', 'Update GitHub username')
  .option('--website <url>', 'Update website URL')
  .option('--config <file>', 'Update from configuration file')
  .option('--wallet <name>', 'Wallet to use for transaction (overrides active wallet)')
  .option('--private-key <key>', 'Private key for signing (or use env ENSEMBLE_PRIVATE_KEY)')
  .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
  .option('--gas-limit <limit>', 'Custom gas limit')
  .option('--dry-run', 'Preview changes without submitting transaction')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (agentAddress: string | undefined, options, command) => {
    if (options.help || !agentAddress) {
      updateAgentCommand.outputHelp();
      return;
    }
    
    // Get global options from parent commands
    const globalOptions = command.parent?.parent?.opts() || {};
    
    try {
      const spinner = ora(`Fetching current agent data for ${agentAddress}...`).start();

      // Verify agent exists
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      let currentAgent;
      try {
        currentAgent = await agentService.getAgentRecord(agentAddress);
        spinner.succeed('Agent found');
      } catch (error: any) {
        spinner.fail('Agent not found');
        console.error(chalk.red(`❌ Agent not found: ${agentAddress}`));
        process.exit(1);
      }

      // Build update data
      let updateData: any = {};

      if (options.config) {
        // Update from config file
        const validation = await validateAgentRecordYAML(options.config);
        if (!validation.valid) {
          console.error(chalk.red('❌ Config file validation failed:'));
          validation.errors.forEach(error => {
            console.error(chalk.red(`  • ${error}`));
          });
          process.exit(1);
        }

        const fileContent = await readFile(options.config, 'utf-8');
        const agentRecord: AgentRecordYAML = yamlParse(fileContent);

        updateData = {
          name: agentRecord.name,
          description: agentRecord.description,
          category: agentRecord.category,
          imageURI: agentRecord.imageURI,
          attributes: agentRecord.attributes,
          instructions: agentRecord.instructions,
          prompts: agentRecord.prompts,
          socials: agentRecord.socials,
          communicationType: agentRecord.communication?.type,
          communicationURL: agentRecord.communication?.url,
          communicationParams: agentRecord.communication?.params,
          status: agentRecord.status
        };
      } else {
        // Update from individual options
        if (options.name) updateData.name = options.name;
        if (options.description) updateData.description = options.description;
        if (options.category) updateData.category = options.category;
        if (options.imageUri) updateData.imageURI = options.imageUri;
        if (options.status) updateData.status = options.status;
        if (options.communicationType) updateData.communicationType = options.communicationType;
        if (options.communicationUrl) updateData.communicationURL = options.communicationUrl;

        if (options.attributes) {
          updateData.attributes = options.attributes.split(',').map((s: string) => s.trim());
        }

        // Handle socials updates - merge with existing socials
        const socialsUpdate: any = {};
        if (options.twitter) socialsUpdate.twitter = options.twitter;
        if (options.telegram) socialsUpdate.telegram = options.telegram;
        if (options.github) socialsUpdate.github = options.github;
        if (options.website) socialsUpdate.website = options.website;

        if (Object.keys(socialsUpdate).length > 0) {
          // Merge with existing socials instead of replacing
          updateData.socials = {
            ...currentAgent.socials,
            ...socialsUpdate
          };
        }

        // Handle file-based updates
        if (options.instructions) {
          const instructionsContent = await readFile(options.instructions, 'utf-8');
          updateData.instructions = instructionsContent.split('\n').filter(line => line.trim());
        }

        if (options.prompts) {
          const promptsContent = await readFile(options.prompts, 'utf-8');
          updateData.prompts = promptsContent.split('\n').filter(line => line.trim());
        }
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        console.log(chalk.yellow('⚠️  No updates specified'));
        return;
      }

      // Show update summary with current vs new values
      console.log(chalk.blue('\n📋 Update Summary:'));
      console.log(chalk.blue(`Agent: ${currentAgent.name} (${agentAddress})`));
      console.log(chalk.blue('\nChanges:'));
      
      Object.entries(updateData).forEach(([key, newValue]) => {
        const currentValue = (currentAgent as any)[key];
        console.log(chalk.cyan(`  ${key}:`));
        console.log(chalk.red(`    - Current: ${JSON.stringify(currentValue)}`));
        console.log(chalk.green(`    + New: ${JSON.stringify(newValue)}`));
      });

      if (options.dryRun) {
        console.log(chalk.green('\n✅ Dry run completed - no transaction submitted'));
        return;
      }

      // Confirmation
      if (!options.confirm) {
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Proceed with agent update?',
            default: false
          }
        ]);

        if (!proceed) {
          console.log(chalk.yellow('Update cancelled by user'));
          return;
        }
      }

      // Get private key from wallet or options
      const config = await getConfig();
      let privateKey: string | undefined;
      let walletAddress: string | undefined;

      // First check if private key is provided directly
      privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;

      // If no private key, try to use wallet
      if (!privateKey) {
        const effectiveWallet = await getEffectiveWallet(options.wallet ?? globalOptions.wallet);
        
        if (effectiveWallet) {
          console.log(chalk.blue(`\n💼 Using wallet: ${effectiveWallet}`));
          
          // Get wallet password
          const { password } = await inquirer.prompt([
            {
              type: 'password',
              name: 'password',
              message: 'Enter wallet password:',
              mask: '*'
            }
          ]);

          try {
            const walletService = new WalletService(config.rpcUrl);
            const signer = await walletService.getWalletSigner(effectiveWallet, password);
            privateKey = signer.privateKey;
            walletAddress = await signer.getAddress();
            console.log(chalk.blue(`Signing with wallet address: ${walletAddress}`));
            // Check if wallet owns the agent
            if (currentAgent.owner.toLowerCase() !== walletAddress.toLowerCase()) {
              console.error(chalk.red(`❌ Wallet ${walletAddress} does not own this agent`));
              console.error(chalk.red(`Agent owner: ${currentAgent.owner}`));
              process.exit(1);
            }
          } catch (error: any) {
            console.error(chalk.red('❌ Failed to unlock wallet:'));
            console.error(chalk.red(error.message));
            process.exit(1);
          }
        }
      }

      if (!privateKey) {
        console.error(chalk.red('❌ No wallet or private key available for transaction'));
        console.error(chalk.yellow('💡 Options:'));
        console.error(chalk.yellow('   - Use --wallet <name> to specify a wallet'));
        console.error(chalk.yellow('   - Set active wallet: ensemble wallet use <name>'));
        console.error(chalk.yellow('   - Use --private-key option'));
        console.error(chalk.yellow('   - Set ENSEMBLE_PRIVATE_KEY environment variable'));
        process.exit(1);
      }

      const updateSpinner = ora('Updating agent record...').start();

      try {
        // Create new SDK instance with the wallet's private key
        const signer = createSignerFromPrivateKey(privateKey, config.rpcUrl);
        const sdkWithWallet = await createSDKInstance(signer);
        const agentServiceWithWallet = sdkWithWallet.agents;
        
        const result = await agentServiceWithWallet.updateAgentRecord(agentAddress, updateData);

        if (result.success) {
          updateSpinner.succeed('Agent updated successfully');
          console.log(chalk.green('\n✅ Agent update completed'));
          console.log(chalk.blue(`📝 Transaction: ${result.transactionHash}`));
          console.log(chalk.cyan('\n💡 Next steps:'));
          console.log(chalk.cyan(`   - View updated agent: ensemble agents get agent ${agentAddress}`));
          console.log(chalk.cyan(`   - Export agent record: ensemble agents get agent ${agentAddress} --save-record updated-agent.yaml`));
        } else {
          updateSpinner.fail('Agent update failed');
          console.error(chalk.red('❌ Update returned false'));
          process.exit(1);
        }

      } catch (updateError: any) {
        updateSpinner.fail('Agent update failed');
        console.error(chalk.red('❌ Update error:'));
        console.error(chalk.red(updateError.message));
        
        if (updateError.message.includes('IPFS SDK is not initialized')) {
          console.error(chalk.yellow('\n💡 To update agents, you need to configure Pinata IPFS'));
        } else if (updateError.message.includes('execution reverted')) {
          console.error(chalk.yellow('\n💡 Common issues:'));
          console.error(chalk.yellow('   - You may not be the owner of this agent'));
          console.error(chalk.yellow('   - The agent contract may be paused'));
          console.error(chalk.yellow('   - Invalid data format for one of the fields'));
        }
        
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Update failed:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Add subcommand for updating single property
updateAgentCommand
  .command('property <agent-address> <property> <value>')
  .description('Update a single agent property efficiently')
  .option('-h, --help', 'Display help information')
  .option('--wallet <name>', 'Wallet to use for transaction (overrides active wallet)')
  .option('--private-key <key>', 'Private key for signing (or use env ENSEMBLE_PRIVATE_KEY)')
  .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
  .option('--gas-limit <limit>', 'Custom gas limit')
  .option('--confirm', 'Skip confirmation prompt')
  .option('--format <format>', 'Input format for complex values (json, csv)')
  .action(async (agentAddress: string, property: string, value: string, options, command) => {
    if (options.help) {
      updateAgentCommand.command('property').outputHelp();
      return;
    }
    
    // Get global options from parent commands
    const globalOptions = command.parent?.parent?.parent?.opts() || {};
    
    try {
      // Validate property name
      const validProperties = [
        'name', 'description', 'category', 'imageURI', 'status',
        'attributes', 'instructions', 'prompts', 'socials',
        'communicationType', 'communicationURL', 'communicationParams'
      ];

      if (!validProperties.includes(property)) {
        console.error(chalk.red(`❌ Invalid property: ${property}`));
        console.error(chalk.red(`Valid properties: ${validProperties.join(', ')}`));
        process.exit(1);
      }

      // Parse value based on property type and format
      let parsedValue: any = value;

      if (['attributes', 'instructions', 'prompts'].includes(property)) {
        if (options.format === 'json') {
          parsedValue = JSON.parse(value);
        } else {
          parsedValue = value.split(',').map((s: string) => s.trim());
        }
      } else if (['socials', 'communicationParams'].includes(property)) {
        parsedValue = JSON.parse(value);
      }

      console.log(chalk.blue('📋 Property Update:'));
      console.log(`  Agent: ${agentAddress}`);
      console.log(`  Property: ${property}`);
      console.log(`  New Value: ${JSON.stringify(parsedValue)}`);

      // Confirmation
      if (!options.confirm) {
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Proceed with property update?',
            default: false
          }
        ]);

        if (!proceed) {
          console.log(chalk.yellow('Update cancelled by user'));
          return;
        }
      }

      // Get private key from wallet or options
      const config = await getConfig();
      let privateKey: string | undefined;

      // First check if private key is provided directly
      privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;

      // If no private key, try to use wallet
      if (!privateKey) {
        const effectiveWallet = await getEffectiveWallet(options.wallet ?? globalOptions.wallet);
        
        if (effectiveWallet) {
          console.log(chalk.blue(`\n💼 Using wallet: ${effectiveWallet}`));
          
          // Get wallet password
          const { password } = await inquirer.prompt([
            {
              type: 'password',
              name: 'password',
              message: 'Enter wallet password:',
              mask: '*'
            }
          ]);

          try {
            const walletService = new WalletService(config.rpcUrl);
            const signer = await walletService.getWalletSigner(effectiveWallet, password);
            privateKey = signer.privateKey;
          } catch (error: any) {
            console.error(chalk.red('❌ Failed to unlock wallet:'));
            console.error(chalk.red(error.message));
            process.exit(1);
          }
        }
      }

      if (!privateKey) {
        console.error(chalk.red('❌ No wallet or private key available for transaction'));
        console.error(chalk.yellow('💡 Options:'));
        console.error(chalk.yellow('   - Use --wallet <name> to specify a wallet'));
        console.error(chalk.yellow('   - Set active wallet: ensemble wallet use <name>'));
        console.error(chalk.yellow('   - Use --private-key option'));
        console.error(chalk.yellow('   - Set ENSEMBLE_PRIVATE_KEY environment variable'));
        process.exit(1);
      }

      const spinner = ora('Updating agent property...').start();

      try {
        // Create new SDK instance with the wallet's private key
        const signer = createSignerFromPrivateKey(privateKey, config.rpcUrl);
        const sdkWithWallet = await createSDKInstance(signer);
        const agentServiceWithWallet = sdkWithWallet.agents;
        
        const result = await agentServiceWithWallet.updateAgentRecordProperty(agentAddress, property as any, parsedValue);

        if (result.success) {
          spinner.succeed('Property updated successfully');
          console.log(chalk.green('\n✅ Property update completed'));
          console.log(chalk.blue(`📝 Transaction: ${result.transactionHash}`));
          console.log(chalk.cyan('\n💡 Next steps:'));
          console.log(chalk.cyan(`   - View updated agent: ensemble agents get agent ${agentAddress}`));
          console.log(chalk.cyan(`   - Update more properties: ensemble agents update ${agentAddress} --${property} <new-value>`));
        } else {
          spinner.fail('Property update failed');
          console.error(chalk.red('❌ Update returned false'));
          process.exit(1);
        }

      } catch (updateError: any) {
        spinner.fail('Property update failed');
        console.error(chalk.red('❌ Update error:'));
        console.error(chalk.red(updateError.message));
        
        if (updateError.message.includes('IPFS SDK is not initialized')) {
          console.error(chalk.yellow('\n💡 To update agents, you need to configure Pinata IPFS:'));
          console.error(chalk.yellow('   1. Sign up for a free account at https://pinata.cloud'));
          console.error(chalk.yellow('   2. Create an API key at https://app.pinata.cloud/developers/api-keys'));
          console.error(chalk.yellow('   3. Set environment variables:'));
          console.error(chalk.yellow('      export PINATA_JWT=your_jwt_here'));
          console.error(chalk.yellow('      export PINATA_GATEWAY=your_gateway_here'));
          console.error(chalk.yellow('   4. Or create a .env file with these variables'));
        }
        
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Property update failed:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });