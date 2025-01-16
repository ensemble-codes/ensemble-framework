import { Ensemble } from "../src";
import { AgentAlreadyRegisteredError, ServiceNotRegisteredError } from "../src/errors";
import { setupSdk } from "./utils";


describe("AgentService Integration Tests", () => {
	let sdk: Ensemble;

	beforeEach(async () => {
	  sdk = setupSdk();
	  await sdk.start();
    });

    it("should fail to register an agent without a service", async () => {
        const agentName = "Agent-test";
        const agentUri = "https://example.com";
        const agentAddress = process.env.AGENT_ADDRESS!;
		const serviceName = "Bull-Post-test";
		const servicePrice = 100;

        await expect(sdk.registerAgent(agentAddress, agentName, agentUri, serviceName, servicePrice))
            .rejects
            .toThrow(ServiceNotRegisteredError);
    });

    it("should register an agent successfully", async () => {

        const agentName = "Agent1";
        const agentUri = "https://example.com";
        const agentAddress = process.env.AGENT_ADDRESS!;
		const serviceName = "Bull-Post";
		const servicePrice = 100;

        await sdk.registerService({
            name: serviceName,
            category: "Social Service",
            description: "This is a KOL service."
        });

        const isRegistered = await sdk.registerAgent(agentAddress, agentName, agentUri, serviceName, servicePrice);

        expect(isRegistered).toEqual(true);

        const agentData = await sdk.getAgent(agentAddress);

        expect(agentData.name).toEqual(agentName);
        expect(agentData.uri).toEqual(agentUri);
        // TODO: fix this
        // expect(agentData.proposals[0].price).toEqual(serviceName);
        // expect(agentData.proposals[0].agent).toEqual(servicePrice);
    });

    it("should not register the same agent twice", async () => {
        const agentName = "Agent-double-register";
        const agentUri = "https://example.com";
        const agentAddress = process.env.AGENT_ADDRESS!;
		const serviceName = "Bull-Post";
		const servicePrice = 100;
        
        await expect(sdk.registerAgent(agentAddress, agentName, agentUri, serviceName, servicePrice))
            .rejects
            .toThrow(AgentAlreadyRegisteredError);

        // const isRegistered = await sdk.registerAgent(agentName, agentUri, agentAddress, serviceName, servicePrice);

        // expect(isRegistered).toEqual(true);

        // await expect(sdk.registerAgent(agentName, agentUri, agentAddress, serviceName, servicePrice))
        //     .rejects
        //     .toThrow(AgentAlreadyRegisteredError);
    });
});
