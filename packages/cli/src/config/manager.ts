import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { CLIConfig } from '../types/config';

const CONFIG_DIR = join(homedir(), '.ensemble');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: CLIConfig = {
  network: 'baseSepolia',
  rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/-KE1qv6R383LymGX4KJpSWZrEgVfuW_7',
  gasPrice: '20',
  outputFormat: 'yaml',
  contracts: {
    agentRegistry: '0xDbF645cC23066cc364C4Db915c78135eE52f11B2',
    taskRegistry: '0x847fA49b999489fD2780fe2843A7b1608106b49b',
    serviceRegistry: '0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244'
  },
  subgraphUrl: 'https://api.goldsky.com/api/public/project_cmcnps2k01akp01uobifl4bby/subgraphs/ensemble-subgraph/0.0.5/gn'
};

export async function getConfig(): Promise<CLIConfig> {
  try {
    if (!existsSync(CONFIG_FILE)) {
      await saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    const configData = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    
    // Merge with defaults to ensure all fields are present
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.warn('Error reading config, using defaults:', error);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: CLIConfig): Promise<void> {
  try {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      await mkdir(CONFIG_DIR, { recursive: true });
    }

    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
}

export async function updateConfig(updates: Partial<CLIConfig>): Promise<CLIConfig> {
  const currentConfig = await getConfig();
  const newConfig = { ...currentConfig, ...updates };
  await saveConfig(newConfig);
  return newConfig;
}

export async function resetConfig(): Promise<CLIConfig> {
  await saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

// Environment variable overrides
export function getConfigWithEnvOverrides(): Promise<CLIConfig> {
  return getConfig().then(config => ({
    ...config,
    network: (process.env.ENSEMBLE_NETWORK as 'mainnet' | 'sepolia' | 'baseSepolia') || config.network,
    rpcUrl: process.env.ENSEMBLE_RPC_URL || config.rpcUrl,
    privateKey: process.env.ENSEMBLE_PRIVATE_KEY || config.privateKey,
    gasPrice: process.env.ENSEMBLE_GAS_PRICE || config.gasPrice,
    outputFormat: (process.env.ENSEMBLE_OUTPUT_FORMAT as 'table' | 'json' | 'csv' | 'yaml') || config.outputFormat
  }));
}