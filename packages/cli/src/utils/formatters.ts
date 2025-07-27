import { table } from 'table';
// Simple CSV formatter without external dependency
import { stringify as yamlStringify } from 'yaml';
import chalk from 'chalk';

export function formatOutput(data: any[], format: string, includeMetadata: boolean = false): string {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(data, null, 2);
    
    case 'yaml':
      return yamlStringify(data);
    
    case 'csv':
      if (data.length === 0) return '';
      return formatCSV(data);
    
    case 'table':
    default:
      return formatTable(data, includeMetadata);
  }
}

function formatCSV(data: any[]): string {
  if (data.length === 0) return '';
  
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

function formatTable(data: any[], includeMetadata: boolean): string {
  if (data.length === 0) {
    return chalk.yellow('No data to display');
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

  return table(rows, {
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

function formatAgentTable(agents: any[], includeMetadata: boolean): string {
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
      row.push(
        Array.isArray(agent.attributes) ? agent.attributes.join(', ') : '',
        formatSocials(agent.socials)
      );
    }

    rows.push(row);
  });

  return table(rows, {
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
      6: { width: 25 }  // Socials column
    } : {}
  });
}

function formatSocials(socials: any): string {
  if (!socials || typeof socials !== 'object') return '';
  
  const socialEntries = Object.entries(socials)
    .filter(([_, value]) => value && value !== '')
    .map(([key, value]) => `${key}: ${value}`);
  
  return socialEntries.join('\\n');
}

export function formatError(error: Error, verbose: boolean = false): string {
  let output = chalk.red(`❌ Error: ${error.message}`);
  
  if (verbose && error.stack) {
    output += '\\n' + chalk.gray(error.stack);
  }
  
  return output;
}

export function formatSuccess(message: string): string {
  return chalk.green(`✅ ${message}`);
}

export function formatWarning(message: string): string {
  return chalk.yellow(`⚠️  ${message}`);
}

export function formatInfo(message: string): string {
  return chalk.blue(`ℹ️  ${message}`);
}