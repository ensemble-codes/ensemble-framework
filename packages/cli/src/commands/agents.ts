import { Command } from 'commander';
import chalk from 'chalk';
import { getAgentsCommand } from './agents/get';
import { listAgentsCommand } from './agents/list';
import { registerAgentCommand } from './agents/register';
import { updateAgentCommand } from './agents/update';

export const agentsCommand = new Command('agents')
  .description('Agent management commands')
  .argument('[address]', 'Agent address (optional - if provided, fetches specific agent)')
  .option('-h, --help', 'Display help information')

// Sub-commands
agentsCommand.addCommand(getAgentsCommand);
agentsCommand.addCommand(listAgentsCommand);
agentsCommand.addCommand(registerAgentCommand);
agentsCommand.addCommand(updateAgentCommand);

// Handle direct agent address or show help
agentsCommand.action(async (address?: string, options?: any) => {
  if (options?.help) {
    agentsCommand.outputHelp();
    return;
  }
  
  if (address) {
    // If an address is provided, fetch that specific agent
    try {
      const { createSDKInstance } = await import('../utils/sdk');
      const { formatOutput } = await import('../utils/formatters');
      
      const sdk = await createSDKInstance();
      const agentService = sdk.agents;

      console.log(chalk.blue(`🔍 Fetching agent ${address}...`));

      const agent = await agentService.getAgentRecord(address);

      console.log(chalk.green('✅ Agent found'));

      const output = formatOutput([agent], 'yaml', true);
      console.log(output);

    } catch (error: any) {
      console.error(chalk.red('❌ Error fetching agent:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  } else {
    // No address provided, show help
    console.log(chalk.yellow('Please specify an agent address or use a subcommand.'));
    agentsCommand.outputHelp();
  }
});