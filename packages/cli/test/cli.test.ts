import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CLI Package', () => {
  it('should have correct package.json configuration', () => {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    expect(packageJson.name).toBe('@ensemble-ai/cli');
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(packageJson.bin).toHaveProperty('ensemble');
    expect(packageJson.dependencies).toHaveProperty('@ensemble-ai/sdk');
    expect(packageJson.dependencies).toHaveProperty('commander');
    expect(packageJson.dependencies).toHaveProperty('inquirer');
    expect(packageJson.dependencies).toHaveProperty('chalk');
  });

  it('should export types correctly', () => {
    const types = require('../src/types');
    
    // Check that SDK types are re-exported
    expect(types).toHaveProperty('TaskStatus');
    expect(types).toHaveProperty('AgentMetadata');
    expect(types).toHaveProperty('TaskData');
    expect(types).toHaveProperty('Service');
    expect(types).toHaveProperty('Proposal');
    
    // Check CLI-specific types
    expect(types).toHaveProperty('CLIConfig');
    expect(types).toHaveProperty('CommandOptions');
    expect(types).toHaveProperty('DEFAULT_PREFERENCES');
    expect(types).toHaveProperty('DEFAULT_NETWORKS');
  });

  it('should have valid default configuration', () => {
    const { DEFAULT_PREFERENCES, DEFAULT_NETWORKS } = require('../src/types');
    
    expect(DEFAULT_PREFERENCES).toHaveProperty('outputFormat', 'table');
    expect(DEFAULT_PREFERENCES).toHaveProperty('confirmTransactions', true);
    expect(DEFAULT_PREFERENCES).toHaveProperty('colorOutput', true);
    
    expect(DEFAULT_NETWORKS).toHaveProperty('base-sepolia');
    expect(DEFAULT_NETWORKS['base-sepolia']).toHaveProperty('chainId', 84532);
    expect(DEFAULT_NETWORKS['base-sepolia']).toHaveProperty('name', 'Base Sepolia');
  });

  it('should have validation helpers', () => {
    const { isValidAddress, isValidPrivateKey, isValidUrl } = require('../src/types');
    
    expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
    expect(isValidAddress('invalid')).toBe(false);
    
    expect(isValidPrivateKey('0x1234567890123456789012345678901234567890123456789012345678901234')).toBe(true);
    expect(isValidPrivateKey('invalid')).toBe(false);
    
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('invalid')).toBe(false);
  });
});