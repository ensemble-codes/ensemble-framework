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

export const updateAgentCommand = new Command('update')
  .description('Update agent record with multiple properties or from a config file')
  .option('-h, --help', 'Display help information')
  .action(() => {
    updateAgentCommand.outputHelp();
  });

// Update agent with config file
updateAgentCommand
  .command('agent <agent-address>')
  .description('Update agent record with multiple properties')
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
  .option('--private-key <key>', 'Private key for signing (or use env PRIVATE_KEY)')
  .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
  .option('--gas-limit <limit>', 'Custom gas limit')
  .option('--dry-run', 'Preview changes without submitting transaction')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (agentAddress: string, options) => {
    if (options.help) {
      updateAgentCommand.command('agent').outputHelp();
      return;
    }
    
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

        // Handle socials updates
        const socialsUpdate: any = {};
        if (options.twitter) socialsUpdate.twitter = options.twitter;
        if (options.telegram) socialsUpdate.telegram = options.telegram;
        if (options.github) socialsUpdate.github = options.github;
        if (options.website) socialsUpdate.website = options.website;

        if (Object.keys(socialsUpdate).length > 0) {
          updateData.socials = socialsUpdate;
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

      // Show update summary
      console.log(chalk.blue('📋 Update Summary:'));
      console.log(`  Agent: ${currentAgent.name} (${agentAddress})`);
      console.log('  Changes:');
      Object.entries(updateData).forEach(([key, value]) => {
        console.log(`    ${key}: ${JSON.stringify(value)}`);
      });

      if (options.dryRun) {
        console.log(chalk.green('✅ Dry run completed - no transaction submitted'));
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

      // Get private key
      const config = await getConfig();
      const privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;

      if (!privateKey) {
        console.error(chalk.red('❌ Private key required for updates'));
        process.exit(1);
      }

      const updateSpinner = ora('Updating agent record...').start();

      try {
        const result = await agentService.updateAgentRecord(agentAddress, updateData);

        if (result.success) {
          updateSpinner.succeed('Agent updated successfully');
          console.log(chalk.green('✅ Agent update completed'));
          console.log(chalk.blue(`Transaction: ${result.transactionHash}`));
        } else {
          updateSpinner.fail('Agent update failed');
          console.error(chalk.red('❌ Update returned false'));
          process.exit(1);
        }

      } catch (updateError: any) {
        updateSpinner.fail('Agent update failed');
        console.error(chalk.red('❌ Update error:'));
        console.error(chalk.red(updateError.message));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Update failed:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Update single property
updateAgentCommand
  .command('agent-property <agent-address> <property> <value>')
  .description('Update a single agent property efficiently')
  .option('-h, --help', 'Display help information')
  .option('--private-key <key>', 'Private key for signing (or use env PRIVATE_KEY)')
  .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
  .option('--gas-limit <limit>', 'Custom gas limit')
  .option('--confirm', 'Skip confirmation prompt')
  .option('--format <format>', 'Input format for complex values (json, csv)')
  .action(async (agentAddress: string, property: string, value: string, options) => {
    if (options.help) {
      updateAgentCommand.command('agent-property').outputHelp();
      return;
    }
    
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

      // Get configuration and update
      const config = await getConfig();
      const privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;

      if (!privateKey) {
        console.error(chalk.red('❌ Private key required for updates'));
        process.exit(1);
      }

      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      const spinner = ora('Updating agent property...').start();

      try {
        const result = await agentService.updateAgentRecordProperty(agentAddress, property as any, parsedValue);

        if (result.success) {
          spinner.succeed('Property updated successfully');
          console.log(chalk.green('✅ Property update completed'));
          console.log(chalk.blue(`Transaction: ${result.transactionHash}`));
        } else {
          spinner.fail('Property update failed');
          console.error(chalk.red('❌ Update returned false'));
          process.exit(1);
        }

      } catch (updateError: any) {
        spinner.fail('Property update failed');
        console.error(chalk.red('❌ Update error:'));
        console.error(chalk.red(updateError.message));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Property update failed:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });