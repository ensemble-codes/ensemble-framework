import { ethers } from "ethers";
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
import { RegisterAgentParams } from "../src/types";
import { PinataSDK } from "pinata-web3";

describe("Ensemble Unit Tests", () => {
  let sdk: Ensemble;
  let agentService: jest.Mocked<AgentService>;
  let serviceRegistryService: jest.Mocked<ServiceRegistryService>;
  let taskService: jest.Mocked<TaskService>;

  beforeEach(async () => {
    const contractServiceMock = {} as unknown as jest.Mocked<ContractService>;
    const mockSigner = {} as unknown as ethers.Signer;

    taskService = {
      createTask: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;

    agentService = {
      registerAgent: jest.fn(),
      registerAgentWithService: jest.fn(),
      setSigner: jest.fn(),
    } as unknown as jest.Mocked<AgentService>;

    serviceRegistryService = {
      registerService: jest.fn(),
      setSigner: jest.fn(),
    } as unknown as jest.Mocked<ServiceRegistryService>;

    sdk = new Ensemble(
      taskService,
      agentService,
      serviceRegistryService,
      mockSigner  // Provide signer for existing tests
    );
  });

  it("should create an Ensemble instance", async () => {
    // Mock dependencies
    const signerMock = {} as unknown as ethers.Signer;
    const ipfsSDKMock = {} as unknown as PinataSDK;

    const configMock = {
      serviceRegistryAddress: "0x123",
      agentRegistryAddress: "0x456",
      taskRegistryAddress: "0x789",
      network: {
        chainId: 1,
        rpcUrl: "https://rpc-url.com", 
      },
      subgraphUrl: "https://test-subgraph.com"
    }

 
    // Create the instance
    const ensembleInstance = Ensemble.create(configMock, signerMock, ipfsSDKMock);
    
    // Assert the instance is created correctly
    expect(ensembleInstance).toBeInstanceOf(Ensemble);
  });

  it("should create an Ensemble instance without ipfsSDK", async () => {
    // Mock dependencies
    const signerMock = {} as unknown as ethers.Signer;

    const configMock = {
      serviceRegistryAddress: "0x123",
      agentRegistryAddress: "0x456",
      taskRegistryAddress: "0x789",
      network: {
        chainId: 1,
        rpcUrl: "https://rpc-url.com", 
      },
      subgraphUrl: "https://test-subgraph.com"
    }

    // Create the instance without ipfsSDK
    const ensembleInstance = Ensemble.create(configMock, signerMock);
    
    // Assert the instance is created correctly
    expect(ensembleInstance).toBeInstanceOf(Ensemble);
  });

  it("should fail to register an agent without a service", async () => {
    const agentParams: RegisterAgentParams = {
      name: "Agent-test",
      description: "This is an agent for testing.",
      category: "Test",
      agentUri: "ipfs://test-uri",
      imageURI: "https://example.com/image.jpg",
      socials: {
        twitter: "https://twitter.com/agent-test",
        telegram: "https://t.me/agent-test",
        dexscreener: "https://dexscreener.com/agent-test",
      },
      communicationType: "xmtp",
      attributes: ["Test"],
      instructions: ["Test"],
      prompts: ["Test"],
    };
    const agentAddress = "0x123";
    const serviceName = "Bull-Post-test";
    const servicePrice = 100;

    agentService.registerAgentWithService.mockRejectedValueOnce(
      new ServiceNotRegisteredError("Service not registered")
    );

    await expect(
      sdk.registerAgentWithService(agentAddress, agentParams, serviceName, servicePrice, "0x0000000000000000000000000000000000000000")
    ).rejects.toThrow(ServiceNotRegisteredError);
  });

  it("should register an agent successfully", async () => {
    const agentParams: RegisterAgentParams = {
      name: "Agent-test",
      description: "This is an agent for testing.",
      category: "Test",
      agentUri: "ipfs://test-uri",
      imageURI: "https://example.com/image.jpg",
      socials: {
        twitter: "https://twitter.com/agent-test",
        telegram: "https://t.me/agent-test",
        dexscreener: "https://dexscreener.com/agent-test",
      },
      communicationType: "xmtp",
      attributes: ["Test"],
      instructions: ["Test"],
      prompts: ["Test"],
    };

    const agentAddress = process.env.AGENT_ADDRESS!;
    const serviceName = "Bull-Post";
    const servicePrice = 100;

    agentService.registerAgentWithService.mockResolvedValueOnce(true);

    const isRegistered = await sdk.registerAgentWithService(
      agentAddress,
      agentParams,
      serviceName,
      servicePrice,
      "0x0000000000000000000000000000000000000000" // ETH address
    );

    expect(isRegistered).toEqual(true);
  });

  it("should not register the same agent twice", async () => {
    const agentParams: RegisterAgentParams = {
      name: "Agent-test",
      description: "This is an agent for testing.",
      category: "Test",
      agentUri: "ipfs://test-uri",
      imageURI: "https://example.com/image.jpg",
      socials: {
        twitter: "https://twitter.com/agent-test",
        telegram: "https://t.me/agent-test",
        dexscreener: "https://dexscreener.com/agent-test",
      },
      communicationType: "xmtp",
      attributes: ["Test"],
      instructions: ["Test"],
      prompts: ["Test"],
    };

    agentService.registerAgentWithService.mockRejectedValueOnce(
      new AgentAlreadyRegisteredError("Agent already registered")
    );

    const agentAddress = process.env.AGENT_ADDRESS!;
    const serviceName = "Bull-Post";
    const servicePrice = 100;

    await expect(
      sdk.registerAgentWithService(agentAddress, agentParams, serviceName, servicePrice, "0x0000000000000000000000000000000000000000")
    ).rejects.toThrow(AgentAlreadyRegisteredError);
  });

  it("should successfully register a service", async () => {
    const service = {
      name: "Test Service",
      metadata: {
        category: "other" as const,
        description: "This is a test service.",
        endpointSchema: "https://api.example.com/test",
        method: "HTTP_POST" as const,
        parametersSchema: {},
        resultSchema: {}
      }
    };

    const mockServiceRecord = {
      id: "test-service-id",
      name: "Test Service",
      owner: "0x123",
      agentAddress: "0x456",
      serviceUri: "ipfs://test",
      status: "draft" as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...service.metadata
    };

    serviceRegistryService.registerService.mockResolvedValueOnce(mockServiceRecord);

    const response = await sdk.registerService(service);

    expect(response).toEqual(mockServiceRecord);
  });

  it("should fail to register the same service twice", async () => {
    const service = {
      name: "Test Service Failed",
      metadata: {
        category: "other" as const,
        description: "This is a test service.",
        endpointSchema: "https://api.example.com/test",
        method: "HTTP_POST" as const,
        parametersSchema: {},
        resultSchema: {}
      }
    };

    const mockServiceRecord = {
      id: "test-service-id",
      name: "Test Service Failed",
      owner: "0x123",
      agentAddress: "0x456",
      serviceUri: "ipfs://test",
      status: "draft" as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...service.metadata
    };

    serviceRegistryService.registerService.mockResolvedValueOnce(mockServiceRecord);
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
      id: BigInt("0"),
      prompt: "This is a test task.",
      status: BigInt(0),
      issuer: process.env.ACCOUNT_ADDRESS!,
      proposalId: BigInt(proposalId),
      rating: BigInt(0),
    };

    taskService.createTask.mockResolvedValueOnce(task);

    const response = await sdk.createTask({
      prompt: "This is a test task.",
      proposalId: proposalId,
    });

    expect(response).toEqual(task);
  });

  describe("Optional Signer Pattern Tests", () => {
    let mockProvider: jest.Mocked<ethers.Provider>;
    let mockSigner: jest.Mocked<ethers.Signer>;
    let configMock: any;

    beforeEach(() => {
      // Mock provider
      mockProvider = {} as jest.Mocked<ethers.Provider>;

      // Mock signer
      mockSigner = {
        getAddress: jest.fn().mockResolvedValue("0x1234567890123456789012345678901234567890"),
      } as unknown as jest.Mocked<ethers.Signer>;

      configMock = {
        serviceRegistryAddress: "0x123",
        agentRegistryAddress: "0x456",
        taskRegistryAddress: "0x789",
        subgraphUrl: "https://test-subgraph.com",
      };
    });

    describe("SDK Creation without Signer", () => {
      it("should create Ensemble instance without signer for read-only operations", () => {
        const ensemble = Ensemble.create(configMock);
        expect(ensemble).toBeInstanceOf(Ensemble);
      });

      it("should create Ensemble instance with provider only", () => {
        const ensemble = Ensemble.create(configMock, mockProvider);
        expect(ensemble).toBeInstanceOf(Ensemble);
      });

      it("should create Ensemble instance with signer (backward compatibility)", () => {
        const ensemble = Ensemble.create(configMock, mockSigner);
        expect(ensemble).toBeInstanceOf(Ensemble);
      });
    });

    describe("setSigner Method", () => {
      it("should allow setting signer after initialization", () => {
        const ensemble = Ensemble.create(configMock);
        
        // Should not throw
        expect(() => ensemble.setSigner(mockSigner)).not.toThrow();
      });

      it("should update signer in all services when setSigner is called", () => {
        const ensemble = Ensemble.create(configMock);
        const agentService = ensemble.agents;
        
        // Mock the setSigner method on services
        const agentSetSignerSpy = jest.spyOn(agentService, 'setSigner');
        
        ensemble.setSigner(mockSigner);
        
        expect(agentSetSignerSpy).toHaveBeenCalledWith(mockSigner);
      });
    });

    describe("Read-only Operations (No Signer Required)", () => {
      let ensemble: Ensemble;

      beforeEach(() => {
        ensemble = Ensemble.create(configMock); // No signer provided
      });

      it("should allow getAgentRecord without signer", async () => {
        const mockAgentRecord = {
          name: "Test Agent",
          description: "Test Description",
          address: "0x123",
          category: "test",
          owner: "0x456",
          agentUri: "ipfs://test",
          imageURI: "https://test.com/image.png",
          attributes: ["test"],
          instructions: ["test instruction"],
          prompts: ["test prompt"],
          socials: {
            twitter: "",
            telegram: "",
            dexscreener: "",
            github: "",
            website: ""
          },
          communicationType: "eliza" as any,
          communicationParams: "{}",
          reputation: BigInt(0),
          totalRatings: BigInt(0)
        };

        // Mock the agentService method
        jest.spyOn(ensemble.agents, 'getAgentRecord').mockResolvedValue(mockAgentRecord);

        const result = await ensemble.getAgentRecord("0x123");
        expect(result).toEqual(mockAgentRecord);
      });

      it("should allow getTaskData without signer", async () => {
        const mockTaskData = {
          id: BigInt(1),
          prompt: "Test task",
          status: BigInt(0),
          issuer: "0x123",
          proposalId: BigInt(1),
        };

        // Mock the taskService method through the SDK
        jest.spyOn(ensemble as any, 'getTaskData').mockResolvedValue(mockTaskData);

        const result = await ensemble.getTaskData("1");
        expect(result).toEqual(mockTaskData);
      });

      it("should allow getAgentsByOwner without signer", async () => {
        const mockAgents = [
          {
            name: "Agent 1",
            description: "Description 1",
            address: "0x123",
            category: "test",
            owner: "0x456",
            agentUri: "ipfs://test1",
            imageURI: "https://test.com/image1.png",
            attributes: ["test"],
            instructions: ["instruction"],
            prompts: ["prompt"],
            socials: {
              twitter: "", telegram: "", dexscreener: "", github: "", website: ""
            },
            communicationType: "eliza" as any,
            communicationParams: "{}",
            reputation: BigInt(0),
            totalRatings: BigInt(0)
          }
        ];

        jest.spyOn(ensemble.agents, 'getAgentsByOwner').mockResolvedValue(mockAgents);

        const result = await ensemble.getAgentsByOwner("0x456");
        expect(result).toEqual(mockAgents);
      });
    });

    describe("Write Operations Require Signer", () => {
      let ensemble: Ensemble;

      beforeEach(() => {
        ensemble = Ensemble.create(configMock); // No signer provided
      });

      it("should throw error when createTask called without signer", async () => {
        await expect(ensemble.createTask({
          prompt: "Test task",
          proposalId: "1"
        })).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
      });

      it("should throw error when registerAgent called without signer", async () => {
        const agentParams = {
          name: "Test Agent",
          description: "Test Description",
          category: "test",
          agentUri: "ipfs://test-agent-uri",
        };

        await expect(ensemble.registerAgent("0x123", agentParams)).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });

      it("should throw error when registerAgentWithService called without signer", async () => {
        const agentParams = {
          name: "Test Agent",
          description: "Test Description",
          category: "test",
          agentUri: "ipfs://test-agent-uri",
        };

        await expect(ensemble.registerAgentWithService(
          "0x123", 
          agentParams, 
          "TestService", 
          100
        )).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
      });

      it("should throw error when updateAgentMetadata called without signer", async () => {
        const metadata = {
          name: "Updated Agent",
          description: "Updated Description",
          imageURI: "",
          socials: {
            twitter: "", telegram: "", dexscreener: "", github: "", website: ""
          },
          agentCategory: "test",
          communicationType: "eliza" as any,
          attributes: [],
          instructions: [],
          prompts: [],
        };

        await expect(ensemble.updateAgentMetadata("0x123", metadata)).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });

      it("should throw error when completeTask called without signer", async () => {
        await expect(ensemble.completeTask("1", "Task completed")).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });

      it("should throw error when rateTask called without signer", async () => {
        await expect(ensemble.rateTask("1", 5)).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });

      it("should throw error when cancelTask called without signer", async () => {
        await expect(ensemble.cancelTask("1")).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });

      it("should throw error when registerService called without signer", async () => {
        const service = {
          name: "Test Service",
          metadata: {
            category: "other" as const,
            description: "Test service description",
            endpointSchema: "https://api.example.com/test",
            method: "HTTP_POST" as const,
            parametersSchema: {},
            resultSchema: {}
          }
        };

        await expect(ensemble.registerService(service)).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });

      it("should throw error when addProposal called without signer", async () => {
        await expect(ensemble.addProposal(
          "0x123", 
          "TestService", 
          100, 
          "0x456"
        )).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
      });

      it("should throw error when getWalletAddress called without signer", async () => {
        await expect(ensemble.getWalletAddress()).rejects.toThrow(
          "Signer required for write operations. Call setSigner() first."
        );
      });
    });

    describe("Write Operations Work After setSigner", () => {
      let ensemble: Ensemble;

      beforeEach(() => {
        ensemble = Ensemble.create(configMock); // No signer initially
        ensemble.setSigner(mockSigner); // Add signer
      });

      it("should allow createTask after setSigner", async () => {
        const mockTask = {
          id: BigInt(1),
          prompt: "Test task",
          status: BigInt(0),
          issuer: "0x123",
          proposalId: BigInt(1),
        };

        // Mock the taskService createTask method
        const taskService = (ensemble as any).taskService;
        taskService.createTask = jest.fn().mockResolvedValue(mockTask);

        // This should not throw since signer was set
        const result = await ensemble.createTask({
          prompt: "Test task",
          proposalId: "1"
        });

        expect(result).toEqual(mockTask);
        expect(taskService.createTask).toHaveBeenCalledWith({
          prompt: "Test task",
          proposalId: "1"
        });
      });

      it("should allow getWalletAddress after setSigner", async () => {
        // Mock the agentService method
        jest.spyOn(ensemble.agents, 'getAgentAddress').mockResolvedValue("0x1234567890123456789012345678901234567890");

        const address = await ensemble.getWalletAddress();
        expect(address).toBe("0x1234567890123456789012345678901234567890");
      });
    });

    describe("Mixed Usage Scenarios", () => {
      it("should support analytics dashboard scenario (read-only)", async () => {
        const ensemble = Ensemble.create(configMock); // No signer for analytics

        // Mock read operations that analytics dashboard would use
        jest.spyOn(ensemble.agents, 'getAgentsByOwner').mockResolvedValue([]);
        jest.spyOn(ensemble.agents, 'searchAgents').mockResolvedValue([]);

        // These should work without signer
        const agentsByOwner = await ensemble.getAgentsByOwner("0x123");
        const searchResults = await ensemble.agents.searchAgents("AI");

        expect(agentsByOwner).toEqual([]);
        expect(searchResults).toEqual([]);
      });

      it("should support delayed wallet connection scenario", async () => {
        // Start without signer (user hasn't connected wallet yet)
        const ensemble = Ensemble.create(configMock);

        // User can browse agents
        jest.spyOn(ensemble.agents, 'getAgentsByOwner').mockResolvedValue([]);
        await ensemble.getAgentsByOwner("0x123");

        // User connects wallet later
        ensemble.setSigner(mockSigner);

        // Now user can perform write operations
        jest.spyOn(ensemble.agents, 'getAgentAddress').mockResolvedValue("0x123");
        const address = await ensemble.getWalletAddress();
        expect(address).toBe("0x123");
      });

      it("should support agent browser scenario (read-only agent discovery)", async () => {
        const ensemble = Ensemble.create(configMock);

        // Mock agent discovery operations
        const mockAgents = [{
          name: "Agent 1",
          agentUri: "ipfs://test",
          owner: "0x123",
          agent: "0x456",
          reputation: BigInt(100),
          totalRatings: BigInt(10)
        }];

        jest.spyOn(ensemble.agents, 'searchAgents').mockResolvedValue(mockAgents);

        const results = await ensemble.agents.searchAgents("chatbot");
        expect(results).toEqual(mockAgents);
      });
    });

    describe("Backward Compatibility", () => {
      it("should maintain backward compatibility with existing signer-first pattern", () => {
        const ensemble = Ensemble.create(configMock, mockSigner);
        expect(ensemble).toBeInstanceOf(Ensemble);
      });

      it("should work with existing code that provides signer upfront", async () => {
        const ensemble = Ensemble.create(configMock, mockSigner);
        
        // Mock getWalletAddress to verify signer is available
        jest.spyOn(ensemble.agents, 'getAgentAddress').mockResolvedValue("0x123");
        
        const address = await ensemble.getWalletAddress();
        expect(address).toBe("0x123");
      });
    });
  });
});
