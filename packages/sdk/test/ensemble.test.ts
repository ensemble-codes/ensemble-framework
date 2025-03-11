import {
  AgentService,
  ContractService,
  Ensemble,
  ServiceRegistryService,
  TaskService,
} from "../src";
import {
  AgentAlreadyRegisteredError,
  ServiceAlreadyRegisteredError,
  ServiceNotRegisteredError,
} from "../src/errors";
import { AgentMetadata } from "../src/types";

describe("Ensemble Unit Tests", () => {
  let sdk: Ensemble;
  let agentService: jest.Mocked<AgentService>;
  let serviceRegistryService: jest.Mocked<ServiceRegistryService>;
  let taskService: jest.Mocked<TaskService>;

  beforeEach(async () => {
    const contractServiceMock = {} as unknown as jest.Mocked<ContractService>;

    taskService = {
      createTask: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;

    agentService = {
      registerAgent: jest.fn(),
    } as unknown as jest.Mocked<AgentService>;

    serviceRegistryService = {
      registerService: jest.fn(),
    } as unknown as jest.Mocked<ServiceRegistryService>;

    sdk = new Ensemble(
      contractServiceMock,
      taskService,
      agentService,
      serviceRegistryService
    );
  });

  it("should fail to register an agent without a service", async () => {
    const agentMetadata: AgentMetadata = {
      name: "Agent-test",
      description: "This is an agent for testing.",
      imageURI: "https://example.com/image.jpg",
      socials: {
        twitter: "https://twitter.com/agent-test",
        telegram: "https://t.me/agent-test",
        dexscreener: "https://dexscreener.com/agent-test",
      },
      attributes: [
        {
          trait_type: "Test",
          value: "Test",
        },
      ],
    };
    const agentAddress = "0x123";
    const serviceName = "Bull-Post-test";
    const servicePrice = 100;

    agentService.registerAgent.mockRejectedValueOnce(
      new ServiceNotRegisteredError("Service not registered")
    );

    await expect(
      sdk.registerAgent(agentAddress, agentMetadata, serviceName, servicePrice)
    ).rejects.toThrow(ServiceNotRegisteredError);
  });

  it("should register an agent successfully", async () => {
    const agentMetadata: AgentMetadata = {
      name: "Agent-test",
      description: "This is an agent for testing.",
      imageURI: "https://example.com/image.jpg",
      socials: {
        twitter: "https://twitter.com/agent-test",
        telegram: "https://t.me/agent-test",
        dexscreener: "https://dexscreener.com/agent-test",
      },
      attributes: [
        {
          trait_type: "Test",
          value: "Test",
        },
      ],
    };

    const agentAddress = process.env.AGENT_ADDRESS!;
    const serviceName = "Bull-Post";
    const servicePrice = 100;

    agentService.registerAgent.mockResolvedValueOnce(true);

    const isRegistered = await sdk.registerAgent(
      agentAddress,
      agentMetadata,
      serviceName,
      servicePrice
    );

    expect(isRegistered).toEqual(true);
  });

  it("should not register the same agent twice", async () => {
    const agentMetadata: AgentMetadata = {
      name: "Agent-test",
      description: "This is an agent for testing.",
      imageURI: "https://example.com/image.jpg",
      socials: {
        twitter: "https://twitter.com/agent-test",
        telegram: "https://t.me/agent-test",
        dexscreener: "https://dexscreener.com/agent-test",
      },
      attributes: [
        {
          trait_type: "Test",
          value: "Test",
        },
      ],
    };

    agentService.registerAgent.mockRejectedValueOnce(
      new AgentAlreadyRegisteredError("Agent already registered")
    );

    const agentAddress = process.env.AGENT_ADDRESS!;
    const serviceName = "Bull-Post";
    const servicePrice = 100;

    await expect(
      sdk.registerAgent(agentAddress, agentMetadata, serviceName, servicePrice)
    ).rejects.toThrow(AgentAlreadyRegisteredError);
  });

  it("should successfully register a service", async () => {
    const service = {
      name: "Test Service",
      category: "Utility",
      description: "This is a test service.",
    };

    serviceRegistryService.registerService.mockResolvedValueOnce(true);

    const response = await sdk.registerService(service);

    expect(response).toEqual(true);
  });

  it("should fail to register the same service twice", async () => {
    const service = {
      name: "Test Service Failed",
      category: "Utility",
      description: "This is a test service.",
    };

    serviceRegistryService.registerService.mockResolvedValueOnce(true);
    serviceRegistryService.registerService.mockRejectedValueOnce(
      new ServiceAlreadyRegisteredError(service.name)
    );

    await sdk.registerService(service);
    await expect(sdk.registerService(service)).rejects.toThrow(
      ServiceAlreadyRegisteredError
    );
  });

  it("should not create a task without a proposal", async () => {
    const nonExistentProposalId = "1234";

    taskService.createTask.mockRejectedValueOnce(
      new Error("Proposal not found")
    );

    await expect(
      sdk.createTask({
        prompt: "This is a test task.",
        proposalId: nonExistentProposalId,
      })
    ).rejects.toThrow(Error);
  });

  it("should create a task", async () => {
    const proposalId = "0";

    const task = {
      id: "0",
      prompt: "This is a test task.",
      status: 0,
      issuer: process.env.ACCOUNT_ADDRESS!,
      proposalId: proposalId,
      rating: 0,
    };

    taskService.createTask.mockResolvedValueOnce(task);

    const response = await sdk.createTask({
      prompt: "This is a test task.",
      proposalId: proposalId,
    });

    expect(response).toEqual(task);
  });
});
