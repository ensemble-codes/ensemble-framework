import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import * as CryptoJS from 'crypto-js';
import { readFile, writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  WalletManager,
  WalletData,
  EncryptedWallet,
  WalletCreateOptions,
  WalletImportOptions,
  WalletExportOptions,
  WalletBalance,
  Transaction,
  WalletError,
  WalletNotFoundError,
  WalletAlreadyExistsError,
  InvalidPasswordError,
  InvalidMnemonicError,
  InvalidPrivateKeyError
} from '../types/wallet';

export class WalletService implements WalletManager {
  private readonly walletsDir: string;
  private readonly rpcUrl: string;

  constructor(rpcUrl: string) {
    this.walletsDir = join(homedir(), '.ensemble', 'wallets');
    this.rpcUrl = rpcUrl;
    this.ensureWalletsDirectory();
  }

  private async ensureWalletsDirectory(): Promise<void> {
    if (!existsSync(this.walletsDir)) {
      await mkdir(this.walletsDir, { recursive: true });
    }
  }

  private getWalletFilePath(name: string): string {
    return join(this.walletsDir, `${name}.json`);
  }

  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  private generateIV(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }

  private encryptData(data: string, password: string, salt: string, iv: string): string {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 10000
    });
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return encrypted.toString();
  }

  private decryptData(encryptedData: string, password: string, salt: string, iv: string): string {
    try {
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      });
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) {
        throw new InvalidPasswordError();
      }
      
      return result;
    } catch (error) {
      throw new InvalidPasswordError();
    }
  }

  async createWallet(options: WalletCreateOptions): Promise<{ address: string; mnemonic?: string }> {
    const { name, password, type = 'mnemonic' } = options;
    
    // Check if wallet already exists
    if (existsSync(this.getWalletFilePath(name))) {
      throw new WalletAlreadyExistsError(name);
    }

    let wallet: ethers.HDNodeWallet | ethers.Wallet;
    let dataToEncrypt: string;
    let mnemonic: string | undefined;

    if (type === 'mnemonic') {
      // Generate mnemonic
      mnemonic = bip39.generateMnemonic();
      wallet = ethers.Wallet.fromPhrase(mnemonic);
      dataToEncrypt = mnemonic;
    } else {
      // Generate random private key
      wallet = ethers.Wallet.createRandom();
      dataToEncrypt = wallet.privateKey;
    }

    // Encrypt the data
    const salt = this.generateSalt();
    const iv = this.generateIV();
    const encryptedData = this.encryptData(dataToEncrypt, password, salt, iv);

    // Create wallet file
    const encryptedWallet: EncryptedWallet = {
      name,
      address: wallet.address,
      encryptedData,
      salt,
      iv,
      type,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await writeFile(
      this.getWalletFilePath(name), 
      JSON.stringify(encryptedWallet, null, 2)
    );

    return { 
      address: wallet.address, 
      mnemonic: type === 'mnemonic' ? mnemonic : undefined 
    };
  }

  async importWallet(options: WalletImportOptions): Promise<{ address: string }> {
    const { name, password, mnemonic, privateKey, keystore, keystorePassword } = options;
    
    // Check if wallet already exists
    if (existsSync(this.getWalletFilePath(name))) {
      throw new WalletAlreadyExistsError(name);
    }

    let wallet: ethers.HDNodeWallet | ethers.Wallet;
    let dataToEncrypt: string;
    let type: 'mnemonic' | 'private-key' | 'keystore';

    if (mnemonic) {
      // Import from mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new InvalidMnemonicError();
      }
      wallet = ethers.Wallet.fromPhrase(mnemonic);
      dataToEncrypt = mnemonic;
      type = 'mnemonic';
    } else if (privateKey) {
      // Import from private key
      try {
        wallet = new ethers.Wallet(privateKey);
        dataToEncrypt = privateKey;
        type = 'private-key';
      } catch (error) {
        throw new InvalidPrivateKeyError();
      }
    } else if (keystore && keystorePassword) {
      // Import from keystore
      try {
        wallet = await ethers.Wallet.fromEncryptedJson(keystore, keystorePassword);
        dataToEncrypt = wallet.privateKey;
        type = 'keystore';
      } catch (error) {
        throw new WalletError('Invalid keystore file or password', 'INVALID_KEYSTORE');
      }
    } else {
      throw new WalletError('Must provide either mnemonic, private key, or keystore data', 'MISSING_IMPORT_DATA');
    }

    // Encrypt the data
    const salt = this.generateSalt();
    const iv = this.generateIV();
    const encryptedData = this.encryptData(dataToEncrypt, password, salt, iv);

    // Create wallet file
    const encryptedWallet: EncryptedWallet = {
      name,
      address: wallet.address,
      encryptedData,
      salt,
      iv,
      type,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await writeFile(
      this.getWalletFilePath(name), 
      JSON.stringify(encryptedWallet, null, 2)
    );

    return { address: wallet.address };
  }

  async listWallets(): Promise<WalletData[]> {
    await this.ensureWalletsDirectory();
    
    try {
      const files = await readdir(this.walletsDir);
      const walletFiles = files.filter(file => file.endsWith('.json'));
      
      const wallets: WalletData[] = [];
      
      for (const file of walletFiles) {
        try {
          const filePath = join(this.walletsDir, file);
          const content = await readFile(filePath, 'utf-8');
          const encryptedWallet: EncryptedWallet = JSON.parse(content);
          
          wallets.push({
            name: encryptedWallet.name,
            address: encryptedWallet.address,
            encrypted: true,
            createdAt: new Date(encryptedWallet.createdAt),
            type: encryptedWallet.type
          });
        } catch (error) {
          // Skip invalid wallet files
          console.warn(`Skipping invalid wallet file: ${file}`);
        }
      }
      
      return wallets.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      return [];
    }
  }

  async exportWallet(options: WalletExportOptions): Promise<string> {
    const { name, password, format, outputPassword } = options;
    
    const walletPath = this.getWalletFilePath(name);
    if (!existsSync(walletPath)) {
      throw new WalletNotFoundError(name);
    }

    // Load and decrypt wallet
    const content = await readFile(walletPath, 'utf-8');
    const encryptedWallet: EncryptedWallet = JSON.parse(content);
    
    const decryptedData = this.decryptData(
      encryptedWallet.encryptedData,
      password,
      encryptedWallet.salt,
      encryptedWallet.iv
    );

    let wallet: ethers.HDNodeWallet | ethers.Wallet;
    
    if (encryptedWallet.type === 'mnemonic') {
      wallet = ethers.Wallet.fromPhrase(decryptedData);
    } else {
      wallet = new ethers.Wallet(decryptedData);
    }

    switch (format) {
      case 'mnemonic':
        if (encryptedWallet.type !== 'mnemonic') {
          throw new WalletError('Cannot export mnemonic for wallet not created from mnemonic', 'INVALID_EXPORT_FORMAT');
        }
        return decryptedData;
        
      case 'private-key':
        return wallet.privateKey;
        
      case 'keystore':
        if (!outputPassword) {
          throw new WalletError('Password required for keystore export', 'PASSWORD_REQUIRED');
        }
        return await wallet.encrypt(outputPassword);
        
      default:
        throw new WalletError(`Unsupported export format: ${format}`, 'INVALID_FORMAT');
    }
  }

  async deleteWallet(name: string, password: string): Promise<boolean> {
    const walletPath = this.getWalletFilePath(name);
    if (!existsSync(walletPath)) {
      throw new WalletNotFoundError(name);
    }

    // Verify password by attempting to decrypt
    const content = await readFile(walletPath, 'utf-8');
    const encryptedWallet: EncryptedWallet = JSON.parse(content);
    
    // This will throw if password is incorrect
    this.decryptData(
      encryptedWallet.encryptedData,
      password,
      encryptedWallet.salt,
      encryptedWallet.iv
    );

    // Delete the wallet file
    await unlink(walletPath);
    return true;
  }

  async getWalletAddress(name: string): Promise<string> {
    const walletPath = this.getWalletFilePath(name);
    if (!existsSync(walletPath)) {
      throw new WalletNotFoundError(name);
    }

    const content = await readFile(walletPath, 'utf-8');
    const encryptedWallet: EncryptedWallet = JSON.parse(content);
    
    return encryptedWallet.address;
  }

  async getWalletSigner(name: string, password: string): Promise<ethers.HDNodeWallet | ethers.Wallet> {
    const walletPath = this.getWalletFilePath(name);
    if (!existsSync(walletPath)) {
      throw new WalletNotFoundError(name);
    }

    const content = await readFile(walletPath, 'utf-8');
    const encryptedWallet: EncryptedWallet = JSON.parse(content);
    
    const decryptedData = this.decryptData(
      encryptedWallet.encryptedData,
      password,
      encryptedWallet.salt,
      encryptedWallet.iv
    );

    let wallet: ethers.HDNodeWallet | ethers.Wallet;
    
    if (encryptedWallet.type === 'mnemonic') {
      wallet = ethers.Wallet.fromPhrase(decryptedData);
    } else {
      wallet = new ethers.Wallet(decryptedData);
    }

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    return wallet.connect(provider);
  }

  async getBalance(nameOrAddress: string): Promise<WalletBalance> {
    let address: string;
    
    // Check if it's an address or wallet name
    if (nameOrAddress.startsWith('0x') && nameOrAddress.length === 42) {
      address = nameOrAddress;
    } else {
      address = await this.getWalletAddress(nameOrAddress);
    }

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const balance = await provider.getBalance(address);
    
    return {
      address,
      eth: ethers.formatEther(balance),
      tokens: [] // TODO: Implement token balance checking
    };
  }

  async getTransactionHistory(nameOrAddress: string, limit: number = 10): Promise<Transaction[]> {
    let address: string;
    
    // Check if it's an address or wallet name
    if (nameOrAddress.startsWith('0x') && nameOrAddress.length === 42) {
      address = nameOrAddress;
    } else {
      address = await this.getWalletAddress(nameOrAddress);
    }

    // TODO: Implement transaction history fetching from blockchain explorer or RPC
    // For now, return empty array
    return [];
  }
}