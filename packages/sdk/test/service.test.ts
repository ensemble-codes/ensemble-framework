import { ethers } from "ethers";
import dotenv from "dotenv";
import { ServiceRegistryService } from "../src/services/ServiceRegistryService";
import { Ensemble } from "../src/ensemble";

// dotenv.config({ path: ".env.local" });
dotenv.config({ path: '.env', override: true });

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

export const setupEnv = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL!);
  const pk = process.env.PRIVATE_KEY!;
  const wallet = new ethers.Wallet(pk, provider);

  return {
	provider,
	signer: wallet
  };
}


export const setupSdk = (type: string = 'user') => {
  const { signer } = setupEnv();
  const sdk = new Ensemble(config, signer);
  sdk.start();
  return sdk;
}

const serviceOne = {
	name: "Bull-Post",
	category: "Social Service",
	description: "This is a KOL service."
};

describe("ServiceRegistry Integration Tests", () => {
    let provider: ethers.JsonRpcProvider;
    let signer: ethers.Wallet;
    let serviceRegistryService: ServiceRegistryService;
    let serviceRegistry: ethers.Contract;
	let sdk: Ensemble;
	
	beforeEach(async () => {
		  const { signer } = await setupEnv();
		  sdk = new Ensemble(config, signer);
		  await sdk.start();
	  });

    beforeAll(async () => {
        provider = new ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL);
        signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

        const serviceRegistryAddress = process.env.SERVICE_REGISTRY_ADDRESS!;
        const serviceRegistryAbi = [
            "function registerService(string name, string category, string description) public returns (tuple(string name, string category, string description))",
            "function isServiceRegistered(string name) public view returns (bool)",
			"event ServiceRegistered(uint256 indexed serviceId, string name, string description)",
            "function getService(string name) public view returns (tuple(string name, string category, string description))"
        ];

        serviceRegistry = new ethers.Contract(serviceRegistryAddress, serviceRegistryAbi, signer);
        serviceRegistryService = new ServiceRegistryService(serviceRegistry);
    });

    it("should register a service successfully", async () => {
        const isRegisteredBefore = await serviceRegistry.isServiceRegistered(serviceOne.name);
        expect(isRegisteredBefore).toBe(false);

        await serviceRegistryService.registerService(serviceOne);

        const isRegisteredAfter = await serviceRegistry.isServiceRegistered(serviceOne.name);
        expect(isRegisteredAfter).toBe(true);
    });

    // it("should emit a ServiceRegistered event", async () => {
    //     const service = {
    //         name: "AnotherService",
    //         category: "Testing",
    //         description: "Another testing service."
    //     };

    //     const result = await serviceRegistryService.registerService(service);
	// 	expect(result).toBe(true);
    // });

    it("should retrieve service details", async () => {
        const serviceDetails = await serviceRegistry.getService(serviceOne.name);

        expect(serviceDetails.name).toBe(serviceOne.name);
        expect(serviceDetails.category).toBe(serviceOne.category);
        expect(serviceDetails.description).toBe(serviceOne.description);
    });

    it("should return false for unregistered services", async () => {
        const isRegistered = await serviceRegistry.isServiceRegistered("NonExistentService");
        expect(isRegistered).toBe(false);
    });
});
