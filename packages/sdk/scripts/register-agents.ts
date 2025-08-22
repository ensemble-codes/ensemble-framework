import { agentsList } from "./data/agentsList";
import { setupSdk } from "./utils/setupSdk";

async function main() {
  const ensemble = setupSdk();
  
  for (const agent of agentsList) {
    console.log(`Registering agent ${agent.name} with address ${agent.address}`);
	  await ensemble.registerAgent(
      agent.address, 
      {
        name: agent.name,
        description: agent.description,
        agentCategory: agent.agentCategory,
        instructions: agent.instructions,
        prompts: agent.prompts,
        imageURI: agent.imageURI,
        socials: agent.socials,
        attributes: agent.attributes,
        communicationType: agent.communicationType
      },
    );
  }

  process.stdin.resume();
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
