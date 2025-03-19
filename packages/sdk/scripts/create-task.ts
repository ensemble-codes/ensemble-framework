import { setupSdk } from "./utils/setupSdk";

async function main() {
  const ensemble = setupSdk();

  let topic = "GOAT";
  let style = "exciting";
  const task = await ensemble.createTask({
    prompt: `Write a tweet about ${topic}. style: ${style}`,
    proposalId: "0",
  });
  console.log(task);
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
