"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgentCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const promises_1 = require("fs/promises");
const yaml_1 = require("yaml");
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const sdk_1 = require("../../utils/sdk");
const validation_1 = require("../../utils/validation");
const manager_1 = require("../../config/manager");
exports.registerAgentCommand = new commander_1.Command('register')
    .description('Register a new agent on the blockchain using an agent-record.yaml file')
    .requiredOption('--config <file>', 'Path to agent-record.yaml file')
    .option('--private-key <key>', 'Private key for signing (or use env ENSEMBLE_PRIVATE_KEY)')
    .option('--network <network>', 'Network (mainnet, sepolia) (default: sepolia)')
    .option('--gas-limit <limit>', 'Custom gas limit')
    .option('--dry-run', 'Validate configuration without submitting transaction')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (options) => {
    try {
        const spinner = (0, ora_1.default)('Validating agent record...').start();
        // Validate the agent record file
        const validation = await (0, validation_1.validateAgentRecordYAML)(options.config, {
            checkUrls: true,
            schemaOnly: false
        });
        if (!validation.valid) {
            spinner.fail('Agent record validation failed');
            console.error(chalk_1.default.red('❌ Validation errors:'));
            validation.errors.forEach(error => {
                console.error(chalk_1.default.red(`  • ${error}`));
            });
            process.exit(1);
        }
        if (validation.warnings.length > 0) {
            spinner.warn('Agent record has warnings');
            console.log(chalk_1.default.yellow('⚠️  Warnings:'));
            validation.warnings.forEach(warning => {
                console.log(chalk_1.default.yellow(`  • ${warning}`));
            });
        }
        else {
            spinner.succeed('Agent record validated successfully');
        }
        // Read and parse the agent record file
        const fileContent = await (0, promises_1.readFile)(options.config, 'utf-8');
        const agentRecord = (0, yaml_1.parse)(fileContent);
        console.log(chalk_1.default.blue('📋 Agent Registration Summary:'));
        console.log(`  Name: ${agentRecord.name}`);
        console.log(`  Category: ${agentRecord.category}`);
        console.log(`  Description: ${agentRecord.description}`);
        console.log(`  Attributes: ${agentRecord.attributes?.join(', ') || 'None'}`);
        if (options.dryRun) {
            console.log(chalk_1.default.green('✅ Dry run completed successfully - no transaction submitted'));
            return;
        }
        // Confirmation prompt
        if (!options.confirm) {
            const { proceed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'Proceed with agent registration?',
                    default: false
                }
            ]);
            if (!proceed) {
                console.log(chalk_1.default.yellow('Registration cancelled by user'));
                return;
            }
        }
        // Get configuration and private key
        const config = await (0, manager_1.getConfig)();
        const privateKey = options.privateKey || process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey;
        if (!privateKey) {
            console.error(chalk_1.default.red('❌ Private key required for registration'));
            console.error(chalk_1.default.red('Use --private-key option, ENSEMBLE_PRIVATE_KEY env var, or configure with: ensemble config set-private-key'));
            process.exit(1);
        }
        // Create SDK instance with signing capability
        const sdk = await (0, sdk_1.createSDKInstance)();
        const signer = (0, sdk_1.createSignerFromPrivateKey)(privateKey, config.rpcUrl);
        const agentAddress = await signer.getAddress();
        console.log(chalk_1.default.blue(`🔑 Using agent address: ${agentAddress}`));
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
            communicationType: agentRecord.communication?.type || 'websocket',
            attributes: agentRecord.attributes || [],
            instructions: agentRecord.instructions || [],
            prompts: agentRecord.prompts || [],
            communicationURL: agentRecord.communication?.url,
            communicationParams: agentRecord.communication?.params
        };
        const registrationSpinner = (0, ora_1.default)('Registering agent on blockchain...').start();
        try {
            // Register the agent
            const agentService = sdk.agents;
            const success = await agentService.registerAgent(agentAddress, metadata);
            if (success) {
                registrationSpinner.succeed('Agent registered successfully');
                console.log(chalk_1.default.green('✅ Agent registration completed'));
                console.log(chalk_1.default.blue(`🎉 Agent Address: ${agentAddress}`));
                console.log(chalk_1.default.blue('💡 You can now view your agent with:'));
                console.log(chalk_1.default.blue(`   ensemble get agent ${agentAddress}`));
            }
            else {
                registrationSpinner.fail('Agent registration failed');
                console.error(chalk_1.default.red('❌ Registration returned false - check transaction details'));
                process.exit(1);
            }
        }
        catch (registrationError) {
            registrationSpinner.fail('Agent registration failed');
            console.error(chalk_1.default.red('❌ Registration error:'));
            console.error(chalk_1.default.red(registrationError.message));
            if (registrationError.message.includes('Agent already registered')) {
                console.log(chalk_1.default.yellow('💡 This agent address is already registered. Try updating instead:'));
                console.log(chalk_1.default.yellow(`   ensemble update agent ${agentAddress} --config ${options.config}`));
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Registration failed:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
//# sourceMappingURL=register.js.map