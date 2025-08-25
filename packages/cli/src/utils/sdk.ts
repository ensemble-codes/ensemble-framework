import { Ensemble } from '@ensemble-ai/sdk';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata-web3';
import { getConfig } from '../config/manager';

export async function createSDKInstance(providedSigner?: ethers.Signer): Promise<Ensemble> {
  const config = await getConfig();
  
  // Create provider
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // Use provided signer or create one
  let signer: ethers.Signer;
  if (providedSigner) {
    signer = providedSigner;
  } else if (config.privateKey) {
    signer = new ethers.Wallet(config.privateKey, provider);
  } else {
    // Use a dummy signer for read-only operations
    signer = ethers.Wallet.createRandom().connect(provider);
  }

  // Validate required subgraphUrl
  if (!config.subgraphUrl) {
    throw new Error('subgraphUrl is required in CLI config. Please ensure your config includes a subgraphUrl.');
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

  // Initialize Pinata SDK if credentials are available
  let pinataSDK: PinataSDK | undefined;
  
  const pinataJwt = config.pinata?.jwt;
  const pinataGateway = config.pinata?.gateway;
  
  if (pinataJwt && pinataGateway) {
    pinataSDK = new PinataSDK({
      pinataJwt,
      pinataGateway
    });
  }

  return Ensemble.create(ensembleConfig, signer, pinataSDK);
}

export function createSignerFromPrivateKey(privateKey: string, rpcUrl: string): ethers.Signer {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}