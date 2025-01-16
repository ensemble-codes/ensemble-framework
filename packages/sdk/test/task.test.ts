import { Ensemble } from "../src";
import { AgentAlreadyRegisteredError, ServiceNotRegisteredError } from "../src/errors";
import { setupSdk } from "./utils";

describe("TaskService", () => {
    let sdk: Ensemble;

    beforeEach(async () => {
        sdk = setupSdk();
    });

    function setupAgent(prompt: string, proposalId: string) {
        return {
            prompt,
            proposalId
        }
    }

    it("should not create a task without a proposal", async () => {
      const nonExistentProposalId = "1234";
        await expect(sdk.createTask({
            prompt: "This is a test task.",
            proposalId: nonExistentProposalId
        })).rejects.toThrow(Error);
    });

    it.only("should not create a task", async () => {

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


      const proposalId = "0";
      const response = sdk.createTask({
          prompt: "This is a test task.",
          proposalId: proposalId
      })

      console.log({ response });
    })

});