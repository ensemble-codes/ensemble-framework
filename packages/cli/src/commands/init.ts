import { Command } from 'commander';
import chalk from 'chalk';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import { stringify as yamlStringify } from 'yaml';
import { AgentRecordYAML } from '../types/config';

export const initCommand = new Command('init')
  .description('Initialize templates and configurations');

initCommand
  .command('agent-record [template-type]')
  .description('Generate a template agent-record.yaml file')
  .option('--output <file>', 'Output file path (default: agent-record.yaml)', 'agent-record.yaml')
  .option('--interactive', 'Fill out template interactively')
  .action(async (templateType: string = 'basic', options) => {
    try {
      if (existsSync(options.output)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${options.output} already exists. Overwrite?`,
            default: false
          }
        ]);
        
        if (!overwrite) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }

      let template: AgentRecordYAML;

      if (options.interactive) {
        template = await createInteractiveTemplate();
      } else {
        template = getTemplateByType(templateType);
      }

      const yamlContent = generateAgentRecordYAML(template);
      await writeFile(options.output, yamlContent, 'utf-8');

      console.log(chalk.green(`✅ Agent record template created: ${options.output}`));
      console.log(chalk.blue('📝 Edit the file and use: ensemble register agent --config ' + options.output));

    } catch (error: any) {
      console.error(chalk.red('❌ Error creating template:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

async function createInteractiveTemplate(): Promise<AgentRecordYAML> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Agent name:',
      validate: (input) => input.trim().length > 0 || 'Name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Agent description:',
      validate: (input) => input.trim().length > 0 || 'Description is required'
    },
    {
      type: 'list',
      name: 'category',
      message: 'Agent category:',
      choices: [
        'ai-assistant',
        'chatbot',
        'service',
        'data-analysis',
        'trading',
        'content-creation',
        'automation',
        'other'
      ]
    },
    {
      type: 'input',
      name: 'attributes',
      message: 'Attributes (comma-separated):',
      filter: (input) => input ? input.split(',').map((s: string) => s.trim()) : []
    },
    {
      type: 'list',
      name: 'communicationType',
      message: 'Communication type:',
      choices: ['eliza', 'xmtp'],
      default: 'eliza'
    },
    {
      type: 'input',
      name: 'communicationURL',
      message: 'Communication URL (optional):'
    },
    {
      type: 'input',
      name: 'imageURI',
      message: 'Image URI (optional):'
    },
    {
      type: 'input',
      name: 'twitter',
      message: 'Twitter handle (optional):'
    },
    {
      type: 'input',
      name: 'telegram',
      message: 'Telegram handle (optional):'
    },
    {
      type: 'input',
      name: 'github',
      message: 'GitHub username (optional):'
    },
    {
      type: 'input',
      name: 'website',
      message: 'Website URL (optional):'
    }
  ]);

  return {
    name: answers.name,
    description: answers.description,
    category: answers.category,
    attributes: answers.attributes,
    imageURI: answers.imageURI || '',
    communication: {
      type: answers.communicationType,
      params: {}
    },
    socials: {
      twitter: answers.twitter || '',
      telegram: answers.telegram || '',
      github: answers.github || '',
      website: answers.website || ''
    },
    status: 'active'
  };
}

function getTemplateByType(templateType: string): AgentRecordYAML {
  const templates: Record<string, AgentRecordYAML> = {
    basic: {
      name: 'My Agent',
      description: 'A basic agent description',
      category: 'general',
      attributes: ['example'],
      communication: {
        type: 'eliza',
        params: {}
      },
      socials: {},
      status: 'active'
    },
    chatbot: {
      name: 'My Chatbot',
      description: 'An AI chatbot for customer support',
      category: 'chatbot',
      attributes: ['conversational', 'support', 'ai'],
      instructions: [
        'Be polite and helpful',
        'Provide clear and concise answers',
        'Ask clarifying questions when needed'
      ],
      prompts: [
        'How can I help you today?',
        'What questions do you have?',
        'Tell me more about your issue'
      ],
      communication: {
        type: 'eliza',
        params: {
          timeout: 30000,
          maxConnections: 100
        }
      },
      socials: {
        website: 'https://my-chatbot.com'
      },
      status: 'active'
    },
    assistant: {
      name: 'AI Assistant',
      description: 'A helpful AI assistant for various tasks',
      category: 'ai-assistant',
      attributes: ['helpful', 'versatile', 'ai', 'assistant'],
      instructions: [
        'Understand user intent clearly',
        'Provide step-by-step guidance',
        'Be proactive in offering help'
      ],
      prompts: [
        'Help me write a professional email',
        'Explain this concept in simple terms',
        'Create a plan for my project'
      ],
      communication: {
        type: 'eliza',
        params: {}
      },
      socials: {},
      status: 'active'
    },
    service: {
      name: 'Service Agent',
      description: 'A specialized service-oriented agent',
      category: 'service',
      attributes: ['automated', 'efficient', 'reliable'],
      instructions: [
        'Execute tasks accurately',
        'Report progress and completion',
        'Handle errors gracefully'
      ],
      communication: {
        type: 'eliza',
        params: {
          timeout: 60000
        }
      },
      socials: {},
      status: 'active'
    }
  };

  return templates[templateType] || templates.basic;
}

function generateAgentRecordYAML(template: AgentRecordYAML): string {
  const header = `# Agent Record Configuration
# This file defines the configuration for an Ensemble agent
# Edit the values below and use 'ensemble register agent --config <file>' to register
#
# Required fields: name, description, category
# Optional fields: All others
#
# Generated on: ${new Date().toISOString()}

`;

  return header + yamlStringify(template, {
    indent: 2,
    lineWidth: 80,
    minContentWidth: 20
  });
}