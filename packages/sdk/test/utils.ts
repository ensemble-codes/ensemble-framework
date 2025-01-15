import { ethers } from "ethers";
import dotenv from "dotenv";
import { Ensemble } from "../src/ensemble";

dotenv.config({ path: '.env.test', override: true });

export const setupEnv = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL!);
  const pk = process.env.PRIVATE_KEY!;
  const wallet = new ethers.Wallet(pk, provider);

  return {
	provider,
	signer: wallet
  };
}

const config = {
	network: {
	  rpcUrl: process.env.NETWORK_RPC_URL!,
	  chainId: parseInt(process.env.NETWORK_CHAIN_ID!, 10),
	  name: process.env.NETWORK_NAME!
	},
	taskRegistryAddress: process.env.TASK_REGISTRY_ADDRESS!,
	agentRegistryAddress: process.env.AGENT_REGISTRY_ADDRESS!,
	serviceRegistryAddress: process.env.SERVICE_REGISTRY_ADDRESS!,
};

export const setupSdk = (type: string = 'user') => {
  const { signer } = setupEnv();
  const sdk = new Ensemble(config, signer);
  sdk.start();
  return sdk;
}