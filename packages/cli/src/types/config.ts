export interface CLIConfig {
  network: 'mainnet' | 'sepolia' | 'baseSepolia';
  rpcUrl: string;
  privateKey?: string;
  gasPrice: string;
  outputFormat: 'table' | 'json' | 'csv' | 'yaml';
  activeWallet?: string;
  contracts: {
    agentRegistry: string;
    taskRegistry: string;
    serviceRegistry: string;
  };
  subgraphUrl?: string;
}

export interface AgentRecordYAML {
  name: string;
  description: string;
  category: string;
  attributes?: string[];
  instructions?: string[];
  prompts?: string[];
  imageURI?: string;
  communication?: {
    type: 'websocket' | 'xmtp';
    url?: string;
    params?: Record<string, any>;
  };
  socials?: {
    twitter?: string;
    telegram?: string;
    github?: string;
    website?: string;
    dexscreener?: string;
  };
  status?: 'active' | 'inactive' | 'maintenance';
}