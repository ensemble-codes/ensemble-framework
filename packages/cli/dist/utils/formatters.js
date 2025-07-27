"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatOutput = formatOutput;
exports.formatError = formatError;
exports.formatSuccess = formatSuccess;
exports.formatWarning = formatWarning;
exports.formatInfo = formatInfo;
const table_1 = require("table");
// Simple CSV formatter without external dependency
const yaml_1 = require("yaml");
const chalk_1 = __importDefault(require("chalk"));
function formatOutput(data, format, includeMetadata = false) {
    switch (format.toLowerCase()) {
        case 'json':
            return JSON.stringify(data, null, 2);
        case 'yaml':
            return (0, yaml_1.stringify)(data);
        case 'csv':
            if (data.length === 0)
                return '';
            return formatCSV(data);
        case 'table':
        default:
            return formatTable(data, includeMetadata);
    }
}
function formatCSV(data) {
    if (data.length === 0)
        return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach(item => {
        const row = headers.map(header => {
            const value = item[header];
            if (typeof value === 'object' && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            const stringValue = String(value || '');
            // Escape quotes and wrap in quotes if contains comma
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
}
function formatTable(data, includeMetadata) {
    if (data.length === 0) {
        return chalk_1.default.yellow('No data to display');
    }
    // Handle agent records
    if (data[0].address && data[0].name) {
        return formatAgentTable(data, includeMetadata);
    }
    // Handle generic data
    const headers = Object.keys(data[0]);
    const rows = [headers];
    data.forEach(item => {
        const row = headers.map(header => {
            const value = item[header];
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
            }
            return String(value || '');
        });
        rows.push(row);
    });
    return (0, table_1.table)(rows, {
        border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
        }
    });
}
function formatAgentTable(agents, includeMetadata) {
    const headers = includeMetadata
        ? ['Name', 'Address', 'Category', 'Owner', 'Reputation', 'Attributes', 'Socials']
        : ['Name', 'Address', 'Category', 'Owner', 'Reputation'];
    const rows = [headers];
    agents.forEach(agent => {
        const reputation = typeof agent.reputation === 'bigint'
            ? (Number(agent.reputation) / 1e18).toFixed(2)
            : agent.reputation;
        const row = [
            agent.name || 'Unknown',
            agent.address || 'N/A',
            agent.category || 'general',
            agent.owner || 'N/A',
            reputation.toString()
        ];
        if (includeMetadata) {
            row.push(Array.isArray(agent.attributes) ? agent.attributes.join(', ') : '', formatSocials(agent.socials));
        }
        rows.push(row);
    });
    return (0, table_1.table)(rows, {
        border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
        },
        columnDefault: {
            wrapWord: true
        },
        columns: includeMetadata ? {
            5: { width: 20 }, // Attributes column
            6: { width: 25 } // Socials column
        } : {}
    });
}
function formatSocials(socials) {
    if (!socials || typeof socials !== 'object')
        return '';
    const socialEntries = Object.entries(socials)
        .filter(([_, value]) => value && value !== '')
        .map(([key, value]) => `${key}: ${value}`);
    return socialEntries.join('\\n');
}
function formatError(error, verbose = false) {
    let output = chalk_1.default.red(`❌ Error: ${error.message}`);
    if (verbose && error.stack) {
        output += '\\n' + chalk_1.default.gray(error.stack);
    }
    return output;
}
function formatSuccess(message) {
    return chalk_1.default.green(`✅ ${message}`);
}
function formatWarning(message) {
    return chalk_1.default.yellow(`⚠️  ${message}`);
}
function formatInfo(message) {
    return chalk_1.default.blue(`ℹ️  ${message}`);
}
//# sourceMappingURL=formatters.js.map