import { Command } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as yamlParse } from 'yaml';
import inquirer from 'inquirer';
import ora from 'ora';
import { createSDKInstance, createSignerFromPrivateKey } from '../../utils/sdk';
import { validateAgentRecordYAML } from '../../utils/validation';
import { getConfig } from '../../config/manager';
import { AgentRecordYAML } from '../../types/config';

export const registerAgentCommand = new Command('register')
  .description('Register a new agent on the blockchain using an agent-record.yaml file')
  .option('-h, --help', 'Display help information')
  .requiredOption('--config <file>', 'Path to agent-record.yaml file')
  .option('--private-key <key>', 'Private key for signing (or use env ENSEMBLE_PRIVATE_KEY)')
  .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
  .option('--gas-limit <limit>', 'Custom gas limit')
  .option('--dry-run', 'Validate configuration without submitting transaction')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    if (options.help) {
      registerAgentCommand.outputHelp();
      return;
    }
    
    try {
      const spinner = ora('Validating agent record...').start();

      // Validate the agent record file
      const validation = await validateAgentRecordYAML(options.config, {
        checkUrls: true,
        schemaOnly: false
      });

      if (!validation.valid) {
        spinner.fail('Agent record validation failed');
        console.error(chalk.red('❌ Validation errors:'));
        validation.errors.forEach(error => {
          console.error(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }

      if (validation.warnings.length > 0) {
        spinner.warn('Agent record has warnings');
        console.log(chalk.yellow('⚠️  Warnings:'));
        validation.warnings.forEach(warning => {
          console.log(chalk.yellow(`  • ${warning}`));
        });
      } else {
        spinner.succeed('Agent record validated successfully');
      }

      // Read and parse the agent record file
      const fileContent = await readFile(options.config, 'utf-8');
      const agentRecord: AgentRecordYAML = yamlParse(fileContent);

      console.log(chalk.blue('📋 Agent Registration Summary:'));
      console.log(`  Name: ${agentRecord.name}`);
      console.log(`  Category: ${agentRecord.category}`);
      console.log(`  Description: ${agentRecord.description}`);
      console.log(`  Attributes: ${agentRecord.attributes?.join(', ') || 'None'}`);

      if (options.dryRun) {
        console.log(chalk.green('✅ Dry run completed successfully - no transaction submitted'));
        return;
      }

      // Confirmation prompt
      if (!options.confirm) {
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Proceed with agent registration?',
            default: false
          }
        ]);

        if (!proceed) {
          console.log(chalk.yellow('Registration cancelled by user'));
          return;
        }
      }

      // Get configuration and private key
      const config = await getConfig();
      const privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;

      if (!privateKey) {
        console.error(chalk.red('❌ Private key required for registration'));
        console.error(chalk.red('Use --private-key option, ENSEMBLE_PRIVATE_KEY env var, or configure with: ensemble config set-private-key'));
        process.exit(1);
      }

      // Create SDK instance with signing capability
      const sdk = await createSDKInstance();
      const signer = createSignerFromPrivateKey(privateKey, config.rpcUrl);
      const agentAddress = await signer.getAddress();

      console.log(chalk.blue(`🔑 Using agent address: ${agentAddress}`));

      // Convert YAML to AgentMetadata format
      const metadata = {
        name: agentRecord.name,
        description: agentRecord.description,
        imageURI: agentRecord.imageURI || '',
        socials: {
          twitter: agentRecord.socials?.twitter || '',
          telegram: agentRecord.socials?.telegram || '',
          dexscreener: agentRecord.socials?.dexscreener || '',
          github: agentRecord.socials?.github || '',
          website: agentRecord.socials?.website || ''
        },
        agentCategory: agentRecord.category,
        openingGreeting: 'Hello! I am ready to help.',
        communicationType: agentRecord.communication?.type || 'websocket' as const,
        attributes: agentRecord.attributes || [],
        instructions: agentRecord.instructions || [],
        prompts: agentRecord.prompts || [],
        communicationURL: agentRecord.communication?.url,
        communicationParams: agentRecord.communication?.params
      };

      const registrationSpinner = ora('Registering agent on blockchain...').start();

      try {
        // Register the agent
        const agentService = sdk.agents;
        const success = await agentService.registerAgent(agentAddress, metadata);

        if (success) {
          registrationSpinner.succeed('Agent registered successfully');
          console.log(chalk.green('✅ Agent registration completed'));
          console.log(chalk.blue(`🎉 Agent Address: ${agentAddress}`));
          console.log(chalk.blue('💡 You can now view your agent with:'));
          console.log(chalk.blue(`   ensemble get agent ${agentAddress}`));
        } else {
          registrationSpinner.fail('Agent registration failed');
          console.error(chalk.red('❌ Registration returned false - check transaction details'));
          process.exit(1);
        }

      } catch (registrationError: any) {
        registrationSpinner.fail('Agent registration failed');
        console.error(chalk.red('❌ Registration error:'));
        console.error(chalk.red(registrationError.message));
        
        if (registrationError.message.includes('Agent already registered')) {
          console.log(chalk.yellow('💡 This agent address is already registered. Try updating instead:'));
          console.log(chalk.yellow(`   ensemble update agent ${agentAddress} --config ${options.config}`));
        }
        
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Registration failed:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });