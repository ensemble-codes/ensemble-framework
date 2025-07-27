"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentsCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_1 = require("./agents/get");
const register_1 = require("./agents/register");
const update_1 = require("./agents/update");
exports.agentsCommand = new commander_1.Command('agents')
    .description('Agent management commands')
    .alias('agent');
// Sub-commands
exports.agentsCommand.addCommand(get_1.getAgentsCommand);
exports.agentsCommand.addCommand(register_1.registerAgentCommand);
exports.agentsCommand.addCommand(update_1.updateAgentCommand);
// Show help if no subcommand provided
exports.agentsCommand.action(() => {
    console.log(chalk_1.default.yellow('Please specify an agents subcommand.'));
    exports.agentsCommand.outputHelp();
});
//# sourceMappingURL=agents.js.map