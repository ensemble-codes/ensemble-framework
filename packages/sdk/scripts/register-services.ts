import { ethers } from "ethers";
import { Ensemble } from "../src/ensemble"
import dotenv from "dotenv";
import { servicesList } from "./data/servicesList";

dotenv.config({ override: true });

const rpcUrl = process.env.RPC_URL!;
const taskRegistryAddress = process.env.TASK_REGISTRY_ADDRESS!;
const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS!;
const serviceRegistryAddress = process.env.SERVICE_REGISTRY_ADDRESS!;

const chainId = parseInt(process.env.CHAIN_ID!, 10);
const networkName = process.env.NETWORK_NAME!;

export const setupEnv = () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
  const pk = process.env.PRIVATE_KEY!;
  const wallet = new ethers.Wallet(pk, provider);

  return {
	provider,
	signer: wallet
  };
}


export const setupSdk = () => {
  const { signer } = setupEnv();

  const config = {
    network: {
      rpcUrl: rpcUrl,
      chainId: chainId,
      name: networkName
    },
    taskRegistryAddress: taskRegistryAddress,
    agentRegistryAddress: agentRegistryAddress,
    serviceRegistryAddress: serviceRegistryAddress
  }

  console.log(config)
  const sdk = new Ensemble(config, signer);
  // sdk.start();
  return sdk;
}

async function main() {
  const ensemble = setupSdk();
  
  for (const service of servicesList) {
	await ensemble.registerService(service);
  }

  process.stdin.resume();
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
