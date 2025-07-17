import { proposalsList } from "./data/proposalsList";
import { setupSdk } from "./utils/setupSdk";

async function main() {
  const ensemble = setupSdk();

  console.log(`Creating ${proposalsList.length} proposals...`);

  for (const proposal of proposalsList) {
    try {
      console.log(`Creating proposal for agent ${proposal.agentAddress} for service ${proposal.serviceName}...`);
      await ensemble.addProposal(
        proposal.agentAddress,
        proposal.serviceName,
        Number(proposal.servicePrice),
        proposal.tokenAddress
      );
      console.log(`✓ Successfully created proposal for ${proposal.serviceName}`);
    } catch (error) {
      console.error(`✗ Error creating proposal for ${proposal.serviceName}:`, error);
    }
  }

  console.log("Finished creating proposals.");
  process.stdin.resume();
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});