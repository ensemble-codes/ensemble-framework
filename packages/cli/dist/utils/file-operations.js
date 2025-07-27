"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAgentRecords = saveAgentRecords;
exports.saveAgentRecord = saveAgentRecord;
exports.ensureDirectoryExists = ensureDirectoryExists;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const yaml_1 = require("yaml");
async function saveAgentRecords(agents, directory, prefix = 'agent-record') {
    // Ensure directory exists
    if (!(0, fs_1.existsSync)(directory)) {
        await (0, promises_1.mkdir)(directory, { recursive: true });
    }
    for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const filename = agents.length === 1
            ? `${prefix}.yaml`
            : `${prefix}-${i + 1}.yaml`;
        const filepath = (0, path_1.join)(directory, filename);
        const yamlContent = convertAgentToYAML(agent);
        await (0, promises_1.writeFile)(filepath, yamlContent, 'utf-8');
    }
}
async function saveAgentRecord(agent, filepath) {
    // Ensure directory exists
    const dir = (0, path_1.dirname)(filepath);
    if (!(0, fs_1.existsSync)(dir)) {
        await (0, promises_1.mkdir)(dir, { recursive: true });
    }
    const yamlContent = convertAgentToYAML(agent);
    await (0, promises_1.writeFile)(filepath, yamlContent, 'utf-8');
}
function convertAgentToYAML(agent) {
    const agentRecord = {
        name: agent.name || 'Unknown Agent',
        description: agent.description || '',
        category: agent.category || 'general',
        attributes: agent.attributes || [],
        instructions: agent.instructions || [],
        prompts: agent.prompts || [],
        imageURI: agent.imageURI || '',
        communication: {
            type: agent.communicationType || 'websocket',
            url: agent.communicationURL || '',
            params: agent.communicationParams || {}
        },
        socials: {
            twitter: agent.socials?.twitter || '',
            telegram: agent.socials?.telegram || '',
            github: agent.socials?.github || '',
            website: agent.socials?.website || '',
            dexscreener: agent.socials?.dexscreener || ''
        },
        status: 'active' // Default status
    };
    // Add comment header
    const header = `# Agent Record Configuration
# This file defines the configuration for an Ensemble agent
# Edit the values below and use 'ensemble register agent --config <file>' to register
#
# Generated on: ${new Date().toISOString()}
# Agent Address: ${agent.address || 'Not yet registered'}

`;
    return header + (0, yaml_1.stringify)(agentRecord, {
        indent: 2,
        lineWidth: 80,
        minContentWidth: 20
    });
}
async function ensureDirectoryExists(directory) {
    if (!(0, fs_1.existsSync)(directory)) {
        await (0, promises_1.mkdir)(directory, { recursive: true });
    }
}
//# sourceMappingURL=file-operations.js.map