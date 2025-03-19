import dotenv from "dotenv";
import ethers from "ethers";
import { PinataSDK } from "pinata-web3";
import { Ensemble } from "../../src";

dotenv.config({ override: true });

const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;
const taskRegistryAddress = process.env.TASK_REGISTRY_ADDRESS!;
const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS!;
const serviceRegistryAddress = process.env.SERVICE_REGISTRY_ADDRESS!;
const pinataJwt = process.env.PINATA_JWT!;

const chainId = parseInt(process.env.CHAIN_ID!, 10);
const networkName = process.env.NETWORK_NAME!;

export const setupEnv = () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
  const pk = process.env.PRIVATE_KEY!;
  const wallet = new ethers.Wallet(pk, provider);

  return {
    provider,
    signer: wallet,
  };
};

export const setupSdk = () => {
  const { signer } = setupEnv();

  const config = {
    network: {
      rpcUrl: rpcUrl,
      chainId: chainId,
      name: networkName,
    },
    taskRegistryAddress: taskRegistryAddress,
    agentRegistryAddress: agentRegistryAddress,
    serviceRegistryAddress: serviceRegistryAddress,
  };
  const sdk = Ensemble.create(config, signer, new PinataSDK({ pinataJwt }));
  return sdk;
};
