// Re-export all core and blockchain data types from the SDK
export {
  // Core data types
  AgentMetadata,
  AgentData,
  AgentSocials,
  AgentCommunicationType,
  TaskData,
  TaskExecutionData,
  TaskCreationParams,
  TaskStatus,
  Service,
  Proposal,
  Skill,
  EnsembleConfig,
  NetworkConfig,
  
  // Parameter types
  AddProposalParams,
  registerAgentWithServiceParams,
  RegisterAgentParams,
  
  // Event types
  TaskCreatedEvent,
  AgentAssignedEvent,
  ProposalAddedEvent,
  ProposalRemovedEvent,
  ProposalUpdatedEvent,
  ReputationUpdatedEvent,
  ProposalApprovedEvent,
  TaskAssignedEvent,
  TaskCanceledEvent,
  TaskCompletedEvent,
  TaskRatedEvent,
  TaskStatusChangedEvent,
  
  // SDK Error types
  ServiceNotRegisteredError,
  AgentAlreadyRegisteredError,
  AgentNotRegisteredError,
  ServiceAlreadyRegisteredError,
  ProposalNotFoundError,
  
  // Legacy types
  LegacyRegisterAgentParams,
  LegacyAddProposalParams,
} from '@ensemble-ai/sdk';

/**
 * CLI-specific configuration types
 */
export interface CLIConfig {
  networks: Record<string, CLINetworkConfig>;
  defaultNetwork: string;
  wallets: Record<string, WalletConfig>;
  ipfs: IPFSConfig;
  preferences: PreferencesConfig;
  version: string;
}

// Extend the SDK NetworkConfig for CLI-specific needs
export interface CLINetworkConfig extends NetworkConfig {
  blockExplorer?: string;
  testnet?: boolean;
}

export interface WalletConfig {
  address: string;
  type: 'keystore' | 'privatekey' | 'hardware';
  encrypted: boolean;
  path?: string; // For keystore files or hardware derivation paths
}

export interface IPFSConfig {
  pinataApiKey?: string;
  pinataSecretKey?: string;
  gateway?: string;
}

export interface PreferencesConfig {
  outputFormat: 'table' | 'json' | 'csv' | 'yaml';
  confirmTransactions: boolean;
  autoListen: boolean;
  colorOutput: boolean;
  verboseOutput: boolean;
  defaultGasLimit?: number;
  defaultGasPrice?: string;
}

/**
 * Command-related types
 */
export interface CommandOptions {
  network?: string;
  wallet?: string;
  config?: string;
  verbose?: boolean;
  quiet?: boolean;
  dryRun?: boolean;
  format?: 'table' | 'json' | 'csv' | 'yaml';
  noColor?: boolean;
}

export interface GlobalOptions extends CommandOptions {
  help?: boolean;
  version?: boolean;
}

/**
 * Agent command types
 */
export interface AgentRegisterOptions extends CommandOptions {
  name?: string;
  description?: string;
  image?: string;
  category?: string;
  twitter?: string;
  telegram?: string;
  github?: string;
  website?: string;
  dexscreener?: string;
  communicationType?: AgentCommunicationType;
  communicationUrl?: string;
  attributes?: string;
  instructions?: string;
  prompts?: string;
  interactive?: boolean;
  withService?: boolean;
  serviceName?: string;
  price?: number;
  tokenAddress?: string;
}

export interface AgentListOptions extends CommandOptions {
  owner?: string;
  category?: string;
  minReputation?: number;
  search?: string;
  limit?: number;
  mine?: boolean;
}

export interface AgentUpdateOptions extends CommandOptions {
  name?: string;
  description?: string;
  image?: string;
  addSocial?: string;
  removeSocial?: string;
  interactive?: boolean;
}

/**
 * Task command types
 */
export interface TaskCreateOptions extends CommandOptions {
  prompt?: string;
  proposal?: string;
  interactive?: boolean;
  fromFile?: string;
  wait?: boolean;
  timeout?: number;
}

export interface TaskListOptions extends CommandOptions {
  issuer?: string;
  assignee?: string;
  status?: keyof typeof TaskStatus;
  mine?: boolean;
  assigned?: boolean;
  limit?: number;
}

export interface TaskCompleteOptions extends CommandOptions {
  result?: string;
  fromFile?: string;
  interactive?: boolean;
}

export interface TaskRateOptions extends CommandOptions {
  comment?: string;
}

export interface TaskCancelOptions extends CommandOptions {
  reason?: string;
}

/**
 * Service command types
 */
export interface ServiceRegisterOptions extends CommandOptions {
  name?: string;
  category?: string;
  description?: string;
  interactive?: boolean;
}

export interface ServiceListOptions extends CommandOptions {
  category?: string;
  search?: string;
}

/**
 * Proposal command types
 */
export interface ProposalAddOptions extends CommandOptions {
  service?: string;
  price?: number;
  token?: string;
  agent?: string;
}

export interface ProposalListOptions extends CommandOptions {
  agent?: string;
  service?: string;
  activeOnly?: boolean;
  mine?: boolean;
}

/**
 * Wallet command types
 */
export interface WalletCreateOptions extends CommandOptions {
  password?: boolean;
  mnemonic?: boolean;
  import?: boolean;
}

export interface WalletBalanceOptions extends CommandOptions {
  token?: string;
}

/**
 * Configuration command types
 */
export interface ConfigSetOptions extends CommandOptions {
  global?: boolean;
}

export interface NetworkAddOptions extends CommandOptions {
  chainId?: number;
  rpcUrl?: string;
  taskRegistry?: string;
  agentRegistry?: string;
  serviceRegistry?: string;
  subgraphUrl?: string;
  blockExplorer?: string;
  testnet?: boolean;
}

/**
 * Utility types
 */
export interface OutputFormat {
  format: 'table' | 'json' | 'csv' | 'yaml';
  color: boolean;
}

export interface ProgressOptions {
  text: string;
  spinner?: string;
  color?: string;
}

export interface ConfirmationOptions {
  message: string;
  default?: boolean;
}

export interface SelectionOptions {
  message: string;
  choices: Array<{ name: string; value: string | number }>;
  default?: string | number;
}

/**
 * CLI-specific error types (extending SDK errors)
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ConfigError extends CLIError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

export class WalletError extends CLIError {
  constructor(message: string, details?: any) {
    super(message, 'WALLET_ERROR', details);
    this.name = 'WalletError';
  }
}

export class NetworkError extends CLIError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Event listening types
 */
export interface ListenerOptions {
  tasks?: boolean;
  agent?: string;
  filter?: string;
  output?: string;
}

export interface CLITaskEvent {
  type: 'created' | 'assigned' | 'completed' | 'cancelled' | 'rated';
  taskId: string;
  data: TaskData;
  timestamp: Date;
}

export interface CLIAgentEvent {
  type: 'registered' | 'updated' | 'removed' | 'reputation_updated';
  agentAddress: string;
  data: AgentData;
  timestamp: Date;
}

/**
 * Default configurations
 */
export const DEFAULT_PREFERENCES: PreferencesConfig = {
  outputFormat: 'table',
  confirmTransactions: true,
  autoListen: false,
  colorOutput: true,
  verboseOutput: false,
};

export const DEFAULT_NETWORKS: Record<string, CLINetworkConfig> = {
  'base-sepolia': {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    subgraphUrl: 'https://api.goldsky.com/api/public/project_cm9zz5dndyzbf01tm1a1874j0/subgraphs/ensemble/0.1.0/gn',
    blockExplorer: 'https://sepolia.basescan.org',
    testnet: true,
  },
  'base-mainnet': {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    testnet: false,
  },
};

/**
 * Validation helpers
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidPrivateKey = (key: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(key);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};