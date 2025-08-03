export interface WalletData {
  name: string;
  address: string;
  encrypted: boolean;
  createdAt: Date;
  type: 'mnemonic' | 'private-key' | 'keystore';
}

export interface EncryptedWallet {
  name: string;
  address: string;
  encryptedData: string;
  salt: string;
  iv: string;
  type: 'mnemonic' | 'private-key' | 'keystore';
  createdAt: string;
  version: string;
}

export interface WalletCreateOptions {
  name: string;
  password: string;
  type?: 'mnemonic' | 'private-key';
}

export interface WalletImportOptions {
  name: string;
  password: string;
  mnemonic?: string;
  privateKey?: string;
  keystore?: string;
  keystorePassword?: string;
}

export interface WalletExportOptions {
  name: string;
  password: string;
  format: 'mnemonic' | 'private-key' | 'keystore';
  outputPassword?: string; // For keystore format
}

export interface WalletBalance {
  address: string;
  eth: string;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  blockNumber: number;
}

export interface WalletManager {
  createWallet(options: WalletCreateOptions): Promise<{ address: string; mnemonic?: string }>;
  importWallet(options: WalletImportOptions): Promise<{ address: string }>;
  listWallets(): Promise<WalletData[]>;
  exportWallet(options: WalletExportOptions): Promise<string>;
  deleteWallet(name: string, password: string): Promise<boolean>;
  getWalletAddress(name: string): Promise<string>;
  getWalletSigner(name: string, password: string): Promise<any>;
  getBalance(nameOrAddress: string): Promise<WalletBalance>;
  getTransactionHistory(nameOrAddress: string, limit?: number): Promise<Transaction[]>;
}

export class WalletError extends Error {
  constructor(message: string, public readonly code?: string, public readonly cause?: any) {
    super(message);
    this.name = 'WalletError';
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(walletName: string) {
    super(`Wallet '${walletName}' not found`, 'WALLET_NOT_FOUND');
    this.name = 'WalletNotFoundError';
  }
}

export class WalletAlreadyExistsError extends WalletError {
  constructor(walletName: string) {
    super(`Wallet '${walletName}' already exists`, 'WALLET_EXISTS');
    this.name = 'WalletAlreadyExistsError';
  }
}

export class InvalidPasswordError extends WalletError {
  constructor() {
    super('Invalid password', 'INVALID_PASSWORD');
    this.name = 'InvalidPasswordError';
  }
}

export class InvalidMnemonicError extends WalletError {
  constructor() {
    super('Invalid mnemonic phrase', 'INVALID_MNEMONIC');
    this.name = 'InvalidMnemonicError';
  }
}

export class InvalidPrivateKeyError extends WalletError {
  constructor() {
    super('Invalid private key', 'INVALID_PRIVATE_KEY');
    this.name = 'InvalidPrivateKeyError';
  }
}