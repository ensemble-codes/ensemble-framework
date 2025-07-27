"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const inquirer_1 = __importDefault(require("inquirer"));
const yaml_1 = require("yaml");
exports.initCommand = new commander_1.Command('init')
    .description('Initialize templates and configurations');
exports.initCommand
    .command('agent-record [template-type]')
    .description('Generate a template agent-record.yaml file')
    .option('--output <file>', 'Output file path (default: agent-record.yaml)', 'agent-record.yaml')
    .option('--interactive', 'Fill out template interactively')
    .action(async (templateType = 'basic', options) => {
    try {
        if ((0, fs_1.existsSync)(options.output)) {
            const { overwrite } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `File ${options.output} already exists. Overwrite?`,
                    default: false
                }
            ]);
            if (!overwrite) {
                console.log(chalk_1.default.yellow('Operation cancelled.'));
                return;
            }
        }
        let template;
        if (options.interactive) {
            template = await createInteractiveTemplate();
        }
        else {
            template = getTemplateByType(templateType);
        }
        const yamlContent = generateAgentRecordYAML(template);
        await (0, promises_1.writeFile)(options.output, yamlContent, 'utf-8');
        console.log(chalk_1.default.green(`✅ Agent record template created: ${options.output}`));
        console.log(chalk_1.default.blue('📝 Edit the file and use: ensemble register agent --config ' + options.output));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error creating template:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
async function createInteractiveTemplate() {
    const answers = await inquirer_1.default.prompt([
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
            filter: (input) => input ? input.split(',').map((s) => s.trim()) : []
        },
        {
            type: 'list',
            name: 'communicationType',
            message: 'Communication type:',
            choices: ['websocket', 'xmtp'],
            default: 'websocket'
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
            url: answers.communicationURL || '',
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
function getTemplateByType(templateType) {
    const templates = {
        basic: {
            name: 'My Agent',
            description: 'A basic agent description',
            category: 'general',
            attributes: ['example'],
            communication: {
                type: 'websocket',
                url: '',
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
                type: 'websocket',
                url: 'wss://my-chatbot.com/ws',
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
                type: 'websocket',
                url: '',
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
                type: 'websocket',
                url: '',
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
function generateAgentRecordYAML(template) {
    const header = `# Agent Record Configuration
# This file defines the configuration for an Ensemble agent
# Edit the values below and use 'ensemble register agent --config <file>' to register
#
# Required fields: name, description, category
# Optional fields: All others
#
# Generated on: ${new Date().toISOString()}

`;
    return header + (0, yaml_1.stringify)(template, {
        indent: 2,
        lineWidth: 80,
        minContentWidth: 20
    });
}
//# sourceMappingURL=init.js.map