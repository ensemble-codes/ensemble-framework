"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../utils/sdk");
const validation_1 = require("../utils/validation");
exports.validateCommand = new commander_1.Command('validate')
    .description('Validate agent configurations and blockchain connectivity');
exports.validateCommand
    .command('config')
    .description('Validate CLI configuration')
    .option('--verbose', 'Show detailed validation results')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔍 Validating CLI configuration...'));
        const sdk = await (0, sdk_1.createSDKInstance)();
        // Test basic connectivity
        const agentService = sdk.agents;
        const count = await agentService.getAgentCount();
        console.log(chalk_1.default.green('✅ Configuration is valid'));
        console.log(chalk_1.default.green(`✅ Connected to network with ${count} agents`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Configuration validation failed:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
exports.validateCommand
    .command('network')
    .description('Test blockchain connectivity')
    .option('--network <network>', 'Target network for validation')
    .option('--verbose', 'Show detailed validation results')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔍 Testing blockchain connectivity...'));
        const sdk = await (0, sdk_1.createSDKInstance)();
        // Test multiple operations
        const agentService = sdk.agents;
        console.log(chalk_1.default.blue('  • Testing agent count query...'));
        const count = await agentService.getAgentCount();
        console.log(chalk_1.default.green(`    ✅ Found ${count} agents`));
        console.log(chalk_1.default.blue('  • Testing agent records query...'));
        const agents = await agentService.getAgentRecords({ first: 1 });
        console.log(chalk_1.default.green(`    ✅ Retrieved ${agents.length} agent record(s)`));
        console.log(chalk_1.default.green('✅ Network connectivity validated successfully'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Network validation failed:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
exports.validateCommand
    .command('agent <address>')
    .description('Validate agent exists and is accessible')
    .option('--network <network>', 'Target network for validation')
    .option('--verbose', 'Show detailed validation results')
    .action(async (address, options) => {
    try {
        console.log(chalk_1.default.blue(`🔍 Validating agent ${address}...`));
        const sdk = await (0, sdk_1.createSDKInstance)();
        const agentService = sdk.agents;
        const agent = await agentService.getAgentRecord(address);
        console.log(chalk_1.default.green('✅ Agent found and accessible'));
        if (options.verbose) {
            console.log(chalk_1.default.blue('Agent details:'));
            console.log(`  Name: ${agent.name}`);
            console.log(`  Owner: ${agent.owner}`);
            console.log(`  Category: ${agent.category}`);
            console.log(`  Reputation: ${agent.reputation}`);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Agent validation failed:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
exports.validateCommand
    .command('agent-record <file>')
    .description('Validate agent-record.yaml file')
    .option('--schema-only', 'Only validate YAML schema, skip external validations')
    .option('--check-urls', 'Validate that URLs are accessible')
    .option('--verbose', 'Show detailed validation results')
    .action(async (file, options) => {
    try {
        console.log(chalk_1.default.blue(`🔍 Validating agent record file ${file}...`));
        const validation = await (0, validation_1.validateAgentRecordYAML)(file, {
            checkUrls: options.checkUrls,
            schemaOnly: options.schemaOnly
        });
        if (validation.valid) {
            console.log(chalk_1.default.green('✅ Agent record file is valid'));
            if (options.verbose && validation.warnings.length > 0) {
                console.log(chalk_1.default.yellow('⚠️  Warnings:'));
                validation.warnings.forEach(warning => {
                    console.log(chalk_1.default.yellow(`  • ${warning}`));
                });
            }
        }
        else {
            console.error(chalk_1.default.red('❌ Agent record file validation failed:'));
            validation.errors.forEach(error => {
                console.error(chalk_1.default.red(`  • ${error}`));
            });
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Validation failed:'));
        console.error(chalk_1.default.red(error.message));
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
//# sourceMappingURL=validate.js.map