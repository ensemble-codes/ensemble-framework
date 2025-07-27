import { Ensemble } from '@ensemble-ai/sdk';
import { ethers } from 'ethers';
import { getConfig } from '../config/manager';

export async function createSDKInstance(): Promise<Ensemble> {
  const config = await getConfig();
  
  // Create provider
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // Create signer if private key is available
  let signer: ethers.Signer;
  if (config.privateKey) {
    signer = new ethers.Wallet(config.privateKey, provider);
  } else {
    // Use a dummy signer for read-only operations
    signer = ethers.Wallet.createRandom().connect(provider);
  }

  // Create ensemble config
  const ensembleConfig = {
    taskRegistryAddress: config.contracts.taskRegistry,
    agentRegistryAddress: config.contracts.agentRegistry,
    serviceRegistryAddress: config.contracts.serviceRegistry,
    network: {
      chainId: config.network === 'mainnet' ? 8453 : 84532, // Base mainnet : Base Sepolia
      name: config.network,
      rpcUrl: config.rpcUrl
    },
    subgraphUrl: config.subgraphUrl
  };

  return Ensemble.create(ensembleConfig, signer);
}

export function createSignerFromPrivateKey(privateKey: string, rpcUrl: string): ethers.Signer {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}