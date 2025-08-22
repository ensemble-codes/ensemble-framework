import { Command } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { parse as yamlParse } from 'yaml';
import inquirer from 'inquirer';
import ora from 'ora';
import { createSDKInstance, createSignerFromPrivateKey } from '../../utils/sdk';
import { validateAgentRecordYAML } from '../../utils/validation';
import { validateUpdateParams } from '@ensemble-ai/sdk';
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
  .option('--communication-params <params>', 'Update communication parameters (JSON string - merges with existing)')
  .option('--communication-params-prop <key=value>', 'Update single communication parameter property (format: key=value)')
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
          communicationParams: agentRecord.communication?.params ? JSON.stringify(agentRecord.communication.params) : undefined,
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
        // Handle communication parameters - prop update or JSON merge
        await handleCommunicationParamsUpdate(options, currentAgent, updateData);

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

      // Validate update data using SDK Zod validation
      const validationResult = validateUpdateParams(updateData);
      if (!validationResult.success) {
        console.error(chalk.red('❌ Invalid update data:'));
        validationResult.error.issues.forEach((issue: any) => {
          console.error(chalk.red(`  • ${issue.path.join('.')}: ${issue.message}`));
        });
        process.exit(1);
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

/**
 * Handle communication parameters update from prop update or JSON merge
 */
async function handleCommunicationParamsUpdate(options: any, currentAgent: any, updateData: any): Promise<void> {
  // Check if communication params property update was provided
  const hasPropUpdate = options.communicationParamsProp;
  
  // Check if JSON communication params were provided
  const hasJsonParams = options.communicationParams;
  
  if (!hasPropUpdate && !hasJsonParams) {
    return; // No communication params to update
  }
  
  // Get current communication parameters
  let currentParams: any = {};
  try {
    if (currentAgent.communicationParams && typeof currentAgent.communicationParams === 'string') {
      currentParams = JSON.parse(currentAgent.communicationParams);
    } else if (currentAgent.communicationParams) {
      currentParams = currentAgent.communicationParams;
    }
  } catch (e) {
    console.warn(chalk.yellow('⚠️  Could not parse current communication parameters, starting fresh'));
    currentParams = {};
  }
  
  // Handle JSON merge first (if provided)
  if (hasJsonParams) {
    try {
      const jsonParams = JSON.parse(options.communicationParams);
      currentParams = { ...currentParams, ...jsonParams };
    } catch (e) {
      console.error(chalk.red('❌ Invalid JSON for --communication-params'));
      console.error(chalk.yellow('💡 Example: --communication-params \'{"websocketUrl": "https://example.com"}\''));
      process.exit(1);
    }
  }
  
  // Handle property update (override JSON if both provided)
  if (hasPropUpdate) {
    const propString = options.communicationParamsProp;
    
    if (!propString || !propString.includes('=')) {
      console.error(chalk.red('❌ Invalid format for --communication-params-prop'));
      console.error(chalk.yellow('💡 Example: --communication-params-prop websocketUrl=wss://example.com'));
      process.exit(1);
    }
    
    const [key, ...valueParts] = propString.split('=');
    const value = valueParts.join('='); // Rejoin in case value contains '='
    
    if (!key || !value) {
      console.error(chalk.red('❌ Both key and value are required for --communication-params-prop'));
      console.error(chalk.yellow('💡 Example: --communication-params-prop websocketUrl=wss://example.com'));
      process.exit(1);
    }
    
    // Determine current or target communication type
    const commType = options.communicationType || currentAgent.communicationType || 'socketio-eliza';
    
    // Validate and set the property based on communication type and key
    await validateAndSetCommProperty(currentParams, key, value, commType);
  }
  
  // Set the updated parameters as JSON string
  updateData.communicationParams = JSON.stringify(currentParams);
}

/**
 * Validate and set communication parameter property
 */
async function validateAndSetCommProperty(currentParams: any, key: string, value: string, commType: string): Promise<void> {
  switch (key) {
    case 'websocketUrl':
      if (commType !== 'socketio-eliza' && commType !== 'websocket') {
        console.error(chalk.red(`❌ Cannot set websocketUrl for communication type: ${commType}`));
        process.exit(1);
      }
      if (!value.startsWith('ws://') && !value.startsWith('wss://')) {
        console.error(chalk.red('❌ WebSocket URL must start with ws:// or wss://'));
        process.exit(1);
      }
      currentParams.websocketUrl = value;
      break;
      
    case 'agentId':
      if (commType !== 'socketio-eliza' && commType !== 'websocket') {
        console.error(chalk.red(`❌ Cannot set agentId for communication type: ${commType}`));
        process.exit(1);
      }
      currentParams.agentId = value;
      break;
      
    case 'version':
      if (commType !== 'socketio-eliza' && commType !== 'websocket') {
        console.error(chalk.red(`❌ Cannot set version for communication type: ${commType}`));
        process.exit(1);
      }
      if (!['0.x', '1.x'].includes(value)) {
        console.error(chalk.red('❌ Version must be either "0.x" or "1.x"'));
        process.exit(1);
      }
      currentParams.version = value;
      break;
      
    case 'env':
      if (!['production', 'dev'].includes(value)) {
        console.error(chalk.red('❌ Environment must be either "production" or "dev"'));
        process.exit(1);
      }
      currentParams.env = value;
      break;
      
    case 'address':
      if (commType !== 'xmtp') {
        console.error(chalk.red(`❌ Cannot set address for communication type: ${commType}`));
        process.exit(1);
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        console.error(chalk.red('❌ Address must be a valid Ethereum address'));
        process.exit(1);
      }
      currentParams.address = value;
      break;
      
    default:
      // For unknown properties, just set them (allows for future extensibility)
      console.warn(chalk.yellow(`⚠️  Setting unknown communication parameter: ${key}`));
      currentParams[key] = value;
      break;
  }
}

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
        'communicationType', 'communicationParams'
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
      console.log(`  New Value: ${typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue)}`);

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