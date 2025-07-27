import { Command } from 'commander';
import chalk from 'chalk';
import { getAgentsCommand } from './agents/get';
import { registerAgentCommand } from './agents/register';
import { updateAgentCommand } from './agents/update';

export const agentsCommand = new Command('agents')
  .description('Agent management commands')
  .alias('agent');

// Sub-commands
agentsCommand.addCommand(getAgentsCommand);
agentsCommand.addCommand(registerAgentCommand);
agentsCommand.addCommand(updateAgentCommand);

// Show help if no subcommand provided
agentsCommand.action(() => {
  console.log(chalk.yellow('Please specify an agents subcommand.'));
  agentsCommand.outputHelp();
});