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
import { AgentMetadata } from "../src/types";
import { PinataSDK } from "pinata-web3";

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
      registerAgentWithService: jest.fn(),
    } as unknown as jest.Mocked<AgentService>;

    serviceRegistryService = {
      registerService: jest.fn(),
    } as unknown as jest.Mocked<ServiceRegistryService>;

    sdk = new Ensemble(
      taskService,
      agentService,
      serviceRegistryService
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
      }
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
      }
    }

    // Create the instance without ipfsSDK
    const ensembleInstance = Ensemble.create(configMock, signerMock);
    
    // Assert the instance is created correctly
    expect(ensembleInstance).toBeInstanceOf(Ensemble);
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

    agentService.registerAgentWithService.mockResolvedValueOnce(true);

    const isRegistered = await sdk.registerAgentWithService(
      agentAddress,
      agentMetadata,
      serviceName,
      servicePrice,
      "0x0000000000000000000000000000000000000000" // ETH address
    );

    expect(isRegistered).toEqual(true);
  });
});
