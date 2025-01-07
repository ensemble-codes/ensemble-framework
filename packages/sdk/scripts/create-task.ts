import { ethers } from "ethers";
import { Ensemble } from "../src/ensemble"
import { Proposal, TaskType } from "../src/types";
import dotenv from "dotenv";

dotenv.config({ override: true });

const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;
const taskRegistryAddress = process.env.TASK_REGISTRY_ADDRESS!;
const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS!;

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
    agentRegistryAddress: agentRegistryAddress
  }
  const sdk = new Ensemble(config, signer);
  sdk.start();
  return sdk;
}

async function main() {
  const ensemble = setupSdk()

  ensemble.setOnNewProposalListener(async (proposal: Proposal) => {
    console.log("New proposal received:", proposal);

    await new Promise(resolve => setTimeout(resolve, 1000));
    await ensemble.approveProposal(proposal.taskId, proposal);
    console.log("Proposal approved");
  })
  
  const task = await ensemble.createTask({
    prompt: "Write an exciting tweet about GOAT",
    taskType: TaskType.SIMPLE,
  });
  console.log(task)

  process.stdin.resume();
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
