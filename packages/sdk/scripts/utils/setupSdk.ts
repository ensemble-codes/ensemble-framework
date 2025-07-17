import dotenv from "dotenv";
import { JsonRpcProvider, Wallet } from "ethers";
import { PinataSDK } from "pinata-web3";
import { Ensemble } from "../../src";

dotenv.config({ override: true });


const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;
const taskRegistryAddress = process.env.TASK_REGISTRY_ADDRESS!;
const agentRegistryAddress = process.env.AGENTS_REGISTRY_ADDRESS!;
const serviceRegistryAddress = process.env.SERVICE_REGISTRY_ADDRESS!;
const pinataJwt = process.env.PINATA_JWT!;
const chainId = parseInt(process.env.CHAIN_ID!, 10);
const networkName = process.env.NETWORK_NAME!;

export const setupEnv = () => {
  const provider = new JsonRpcProvider(process.env.RPC_URL!);
  const pk = process.env.PRIVATE_KEY!;
  const wallet = new Wallet(pk, provider);

  return {
    provider,
    signer: wallet,
  };
};

export const setupSdk = () => {
  const { signer } = setupEnv();
  console.log("agentRegistryAddress", process.env.AGENTS_REGISTRY_ADDRESS!);

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
