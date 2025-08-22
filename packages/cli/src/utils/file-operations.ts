import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { stringify as yamlStringify } from 'yaml';
import { AgentRecordYAML } from '../types/config';

export async function saveAgentRecords(
  agents: any[],
  directory: string,
  prefix: string = 'agent-record'
): Promise<void> {
  // Ensure directory exists
  if (!existsSync(directory)) {
    await mkdir(directory, { recursive: true });
  }

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const filename = agents.length === 1 
      ? `${prefix}.yaml`
      : `${prefix}-${i + 1}.yaml`;
    
    const filepath = join(directory, filename);
    const yamlContent = convertAgentToYAML(agent);
    
    await writeFile(filepath, yamlContent, 'utf-8');
  }
}

export async function saveAgentRecord(
  agent: any,
  filepath: string
): Promise<void> {
  // Ensure directory exists
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const yamlContent = convertAgentToYAML(agent);
  await writeFile(filepath, yamlContent, 'utf-8');
}

function convertAgentToYAML(agent: any): string {
  const agentRecord: AgentRecordYAML = {
    name: agent.name || 'Unknown Agent',
    description: agent.description || '',
    category: agent.category || 'general',
    attributes: agent.attributes || [],
    instructions: agent.instructions || [],
    prompts: agent.prompts || [],
    imageURI: agent.imageURI || '',
    communication: {
      type: agent.communicationType || 'eliza',
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

  return header + yamlStringify(agentRecord, {
    indent: 2,
    lineWidth: 80,
    minContentWidth: 20
  });
}

export async function ensureDirectoryExists(directory: string): Promise<void> {
  if (!existsSync(directory)) {
    await mkdir(directory, { recursive: true });
  }
}