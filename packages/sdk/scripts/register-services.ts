import { servicesList } from "./data/servicesList";
import { setupSdk } from "./utils/setupSdk";

async function main() {
  const ensemble = setupSdk();

  for (const service of servicesList) {
    try {
      await ensemble.registerService(service);
    } catch (error) {
      console.error(`Error registering service ${service.name}:`, error);
    }
  }

  process.stdin.resume();
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
