import { Command } from 'commander';
import chalk from 'chalk';
import { createSDKInstance } from '../utils/sdk';
import { validateAgentRecordYAML } from '../utils/validation';

export const validateCommand = new Command('validate')
  .description('Validate agent configurations and blockchain connectivity');

validateCommand
  .command('config')
  .description('Validate CLI configuration')
  .option('--verbose', 'Show detailed validation results')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Validating CLI configuration...'));
      
      const sdk = await createSDKInstance();
      
      // Test basic connectivity
      const agentService = sdk.agents;
      const count = await agentService.getAgentCount();
      
      console.log(chalk.green('✅ Configuration is valid'));
      console.log(chalk.green(`✅ Connected to network with ${count} agents`));
      
    } catch (error: any) {
      console.error(chalk.red('❌ Configuration validation failed:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

validateCommand
  .command('network')
  .description('Test blockchain connectivity')
  .option('--network <network>', 'Target network for validation')
  .option('--verbose', 'Show detailed validation results')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Testing blockchain connectivity...'));
      
      const sdk = await createSDKInstance();
      
      // Test multiple operations
      const agentService = sdk.agents;
      
      console.log(chalk.blue('  • Testing agent count query...'));
      const count = await agentService.getAgentCount();
      console.log(chalk.green(`    ✅ Found ${count} agents`));
      
      console.log(chalk.blue('  • Testing agent records query...'));
      const agents = await agentService.getAgentRecords({ first: 1 });
      console.log(chalk.green(`    ✅ Retrieved ${agents.length} agent record(s)`));
      
      console.log(chalk.green('✅ Network connectivity validated successfully'));
      
    } catch (error: any) {
      console.error(chalk.red('❌ Network validation failed:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

validateCommand
  .command('agent <address>')
  .description('Validate agent exists and is accessible')
  .option('--network <network>', 'Target network for validation')
  .option('--verbose', 'Show detailed validation results')
  .action(async (address: string, options) => {
    try {
      console.log(chalk.blue(`🔍 Validating agent ${address}...`));
      
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;
      
      const agent = await agentService.getAgentRecord(address);
      
      console.log(chalk.green('✅ Agent found and accessible'));
      if (options.verbose) {
        console.log(chalk.blue('Agent details:'));
        console.log(`  Name: ${agent.name}`);
        console.log(`  Owner: ${agent.owner}`);
        console.log(`  Category: ${agent.category}`);
        console.log(`  Reputation: ${agent.reputation}`);
      }
      
    } catch (error: any) {
      console.error(chalk.red('❌ Agent validation failed:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

validateCommand
  .command('agent-record <file>')
  .description('Validate agent-record.yaml file')
  .option('--schema-only', 'Only validate YAML schema, skip external validations')
  .option('--check-urls', 'Validate that URLs are accessible')
  .option('--verbose', 'Show detailed validation results')
  .action(async (file: string, options) => {
    try {
      console.log(chalk.blue(`🔍 Validating agent record file ${file}...`));
      
      const validation = await validateAgentRecordYAML(file, {
        checkUrls: options.checkUrls,
        schemaOnly: options.schemaOnly
      });
      
      if (validation.valid) {
        console.log(chalk.green('✅ Agent record file is valid'));
        if (options.verbose && validation.warnings.length > 0) {
          console.log(chalk.yellow('⚠️  Warnings:'));
          validation.warnings.forEach(warning => {
            console.log(chalk.yellow(`  • ${warning}`));
          });
        }
      } else {
        console.error(chalk.red('❌ Agent record file validation failed:'));
        validation.errors.forEach(error => {
          console.error(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }
      
    } catch (error: any) {
      console.error(chalk.red('❌ Validation failed:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });