"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgentCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const promises_1 = require("fs/promises");
const yaml_1 = require("yaml");
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const sdk_1 = require("../../utils/sdk");
const validation_1 = require("../../utils/validation");
const manager_1 = require("../../config/manager");
exports.updateAgentCommand = new commander_1.Command('update')
    .description('Update agent record with multiple properties or from a config file');
// Update agent with config file
exports.updateAgentCommand
    .command('agent <agent-address>')
    .description('Update agent record with multiple properties')
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
    .action(async (agentAddress, options) => {
    try {
        const spinner = (0, ora_1.default)(`Fetching current agent data for ${agentAddress}...`).start();
        // Verify agent exists
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        let currentAgent;
        try {
            currentAgent = await agentService.getAgentRecord(agentAddress);
            spinner.succeed('Agent found');
        }
        catch (error) {
            spinner.fail('Agent not found');
            console.error(chalk_1.default.red(`❌ Agent not found: ${agentAddress}`));
            process.exit(1);
        }
        // Build update data
        let updateData = {};
        if (options.config) {
            // Update from config file
            const validation = await (0, validation_1.validateAgentRecordYAML)(options.config);
            if (!validation.valid) {
                console.error(chalk_1.default.red('❌ Config file validation failed:'));
                validation.errors.forEach(error => {
                    console.error(chalk_1.default.red(`  • ${error}`));
                });
                process.exit(1);
            }
            const fileContent = await (0, promises_1.readFile)(options.config, 'utf-8');
            const agentRecord = (0, yaml_1.parse)(fileContent);
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
        }
        else {
            // Update from individual options
            if (options.name)
                updateData.name = options.name;
            if (options.description)
                updateData.description = options.description;
            if (options.category)
                updateData.category = options.category;
            if (options.imageUri)
                updateData.imageURI = options.imageUri;
            if (options.status)
                updateData.status = options.status;
            if (options.communicationType)
                updateData.communicationType = options.communicationType;
            if (options.communicationUrl)
                updateData.communicationURL = options.communicationUrl;
            if (options.attributes) {
                updateData.attributes = options.attributes.split(',').map((s) => s.trim());
            }
            // Handle socials updates
            const socialsUpdate = {};
            if (options.twitter)
                socialsUpdate.twitter = options.twitter;
            if (options.telegram)
                socialsUpdate.telegram = options.telegram;
            if (options.github)
                socialsUpdate.github = options.github;
            if (options.website)
                socialsUpdate.website = options.website;
            if (Object.keys(socialsUpdate).length > 0) {
                updateData.socials = socialsUpdate;
            }
            // Handle file-based updates
            if (options.instructions) {
                const instructionsContent = await (0, promises_1.readFile)(options.instructions, 'utf-8');
                updateData.instructions = instructionsContent.split('\n').filter(line => line.trim());
            }
            if (options.prompts) {
                const promptsContent = await (0, promises_1.readFile)(options.prompts, 'utf-8');
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
            console.log(chalk_1.default.yellow('⚠️  No updates specified'));
            return;
        }
        // Show update summary
        console.log(chalk_1.default.blue('📋 Update Summary:'));
        console.log(`  Agent: ${currentAgent.name} (${agentAddress})`);
        console.log('  Changes:');
        Object.entries(updateData).forEach(([key, value]) => {
            console.log(`    ${key}: ${JSON.stringify(value)}`);
        });
        if (options.dryRun) {
            console.log(chalk_1.default.green('✅ Dry run completed - no transaction submitted'));
            return;
        }
        // Confirmation
        if (!options.confirm) {
            const { proceed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'Proceed with agent update?',
                    default: false
                }
            ]);
            if (!proceed) {
                console.log(chalk_1.default.yellow('Update cancelled by user'));
                return;
            }
        }
        // Get private key
        const config = await (0, manager_1.getConfig)();
        const privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;
        if (!privateKey) {
            console.error(chalk_1.default.red('❌ Private key required for updates'));
            process.exit(1);
        }
        const updateSpinner = (0, ora_1.default)('Updating agent record...').start();
        try {
            const result = await agentService.updateAgentRecord(agentAddress, updateData);
            if (result.success) {
                updateSpinner.succeed('Agent updated successfully');
                console.log(chalk_1.default.green('✅ Agent update completed'));
                console.log(chalk_1.default.blue(`Transaction: ${result.transactionHash}`));
            }
            else {
                updateSpinner.fail('Agent update failed');
                console.error(chalk_1.default.red('❌ Update returned false'));
                process.exit(1);
            }
        }
        catch (updateError) {
            updateSpinner.fail('Agent update failed');
            console.error(chalk_1.default.red('❌ Update error:'));
            console.error(chalk_1.default.red(updateError.message));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Update failed:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
// Update single property
exports.updateAgentCommand
    .command('agent-property <agent-address> <property> <value>')
    .description('Update a single agent property efficiently')
    .option('--private-key <key>', 'Private key for signing (or use env PRIVATE_KEY)')
    .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
    .option('--gas-limit <limit>', 'Custom gas limit')
    .option('--confirm', 'Skip confirmation prompt')
    .option('--format <format>', 'Input format for complex values (json, csv)')
    .action(async (agentAddress, property, value, options) => {
    try {
        // Validate property name
        const validProperties = [
            'name', 'description', 'category', 'imageURI', 'status',
            'attributes', 'instructions', 'prompts', 'socials',
            'communicationType', 'communicationURL', 'communicationParams'
        ];
        if (!validProperties.includes(property)) {
            console.error(chalk_1.default.red(`❌ Invalid property: ${property}`));
            console.error(chalk_1.default.red(`Valid properties: ${validProperties.join(', ')}`));
            process.exit(1);
        }
        // Parse value based on property type and format
        let parsedValue = value;
        if (['attributes', 'instructions', 'prompts'].includes(property)) {
            if (options.format === 'json') {
                parsedValue = JSON.parse(value);
            }
            else {
                parsedValue = value.split(',').map((s) => s.trim());
            }
        }
        else if (['socials', 'communicationParams'].includes(property)) {
            parsedValue = JSON.parse(value);
        }
        console.log(chalk_1.default.blue('📋 Property Update:'));
        console.log(`  Agent: ${agentAddress}`);
        console.log(`  Property: ${property}`);
        console.log(`  New Value: ${JSON.stringify(parsedValue)}`);
        // Confirmation
        if (!options.confirm) {
            const { proceed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'Proceed with property update?',
                    default: false
                }
            ]);
            if (!proceed) {
                console.log(chalk_1.default.yellow('Update cancelled by user'));
                return;
            }
        }
        // Get configuration and update
        const config = await (0, manager_1.getConfig)();
        const privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;
        if (!privateKey) {
            console.error(chalk_1.default.red('❌ Private key required for updates'));
            process.exit(1);
        }
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        const spinner = (0, ora_1.default)('Updating agent property...').start();
        try {
            const result = await agentService.updateAgentRecordProperty(agentAddress, property, parsedValue);
            if (result.success) {
                spinner.succeed('Property updated successfully');
                console.log(chalk_1.default.green('✅ Property update completed'));
                console.log(chalk_1.default.blue(`Transaction: ${result.transactionHash}`));
            }
            else {
                spinner.fail('Property update failed');
                console.error(chalk_1.default.red('❌ Update returned false'));
                process.exit(1);
            }
        }
        catch (updateError) {
            spinner.fail('Property update failed');
            console.error(chalk_1.default.red('❌ Update error:'));
            console.error(chalk_1.default.red(updateError.message));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Property update failed:'));
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
//# sourceMappingURL=update.js.map