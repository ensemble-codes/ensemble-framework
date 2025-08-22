import { ethers } from "ethers";
import { AgentService } from "../src/services/AgentService";
import { RegisterAgentParams, AgentMetadata } from "../src/types";
import { AgentsRegistry } from "../typechain";
import { PinataSDK } from "pinata-web3";

describe("AgentService Optional Signer Tests", () => {
  let mockRegistry: jest.Mocked<AgentsRegistry>;
  let mockSigner: jest.Mocked<ethers.Signer>;
  let mockProvider: jest.Mocked<ethers.Provider>;
  let mockIpfsSDK: jest.Mocked<PinataSDK>;

  beforeEach(() => {
    // Mock the AgentsRegistry
    mockRegistry = {
      connect: jest.fn(),
      getAgentData: jest.fn(),
      getReputation: jest.fn(),
      setAgentData: jest.fn(),
      registerAgent: jest.fn(),
      registerAgentWithService: jest.fn(),
      addProposal: jest.fn(),
      removeProposal: jest.fn(),
    } as any;

    // Mock the signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue("0x1234567890123456789012345678901234567890"),
    } as any;

    // Mock the provider
    mockProvider = {} as jest.Mocked<ethers.Provider>;

    // Mock IPFS SDK
    mockIpfsSDK = {
      upload: {
        json: jest.fn().mockResolvedValue({ IpfsHash: "testHash123" })
      }
    } as any;
  });

  describe("Constructor with Optional Signer", () => {
    it("should create AgentService without signer", () => {
      const agentService = new AgentService(
        mockRegistry,
        undefined, // No signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      expect(agentService).toBeInstanceOf(AgentService);
    });

    it("should create AgentService with signer", () => {
      const agentService = new AgentService(
        mockRegistry,
        mockSigner,
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      expect(agentService).toBeInstanceOf(AgentService);
    });
  });

  describe("setSigner Method", () => {
    it("should allow setting signer after initialization", () => {
      const agentService = new AgentService(
        mockRegistry,
        undefined, // Start without signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      expect(() => agentService.setSigner(mockSigner)).not.toThrow();
    });
  });

  describe("Read Operations (No Signer Required)", () => {
    let agentService: AgentService;

    beforeEach(() => {
      agentService = new AgentService(
        mockRegistry,
        undefined, // No signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      // Mock subgraph client
      (agentService as any).subgraphClient = {
        request: jest.fn()
      };
    });

    it("should allow getAgentData without signer", async () => {
      const mockAgentData = [
        "Test Agent",        // name
        "ipfs://test",       // agentUri
        "0x123",            // owner
        "0x456",            // agent
        BigInt(100),        // reputation
        BigInt(10)          // totalRatings
      ] as const;

      mockRegistry.getAgentData.mockResolvedValue(mockAgentData);

      const result = await agentService.getAgentData("0x456");
      expect(result).toEqual(mockAgentData);
      expect(mockRegistry.getAgentData).toHaveBeenCalledWith("0x456");
    });

    it("should allow getAgentRecord without signer", async () => {
      const mockSubgraphResponse = {
        agent: {
          id: "0x123",
          name: "Test Agent",
          agentUri: "ipfs://test",
          owner: "0x456",
          reputation: "100000000000000000000",
          metadata: {
            id: "metadata1",
            name: "Test Agent",
            description: "Test Description",
            agentCategory: "test",
            attributes: ["ai"],
            instructions: ["instruction1"],
            prompts: ["prompt1"],
            communicationType: "eliza",
            communicationParams: "{}",
            imageUri: "https://test.com/image.png",
            twitter: "@test",
            telegram: "@testbot",
            dexscreener: "test",
            github: "testuser",
            website: "https://test.com"
          },
          proposals: []
        }
      };

      (agentService as any).subgraphClient.request.mockResolvedValue(mockSubgraphResponse);

      const result = await agentService.getAgentRecord("0x123");
      
      expect(result.name).toBe("Test Agent");
      expect(result.address).toBe("0x123");
      expect(result.description).toBe("Test Description");
    });

    it("should allow getAgentsByOwner without signer", async () => {
      const mockSubgraphResponse = {
        agents: [{
          id: "0x123",
          name: "Agent 1",
          agentUri: "ipfs://test1",
          owner: "0x456",
          reputation: "100000000000000000000",
          metadata: {
            id: "metadata1",
            name: "Agent 1",
            description: "Description 1",
            agentCategory: "test",
            attributes: ["ai"],
            instructions: [],
            prompts: [],
            communicationType: "eliza",
            communicationParams: "{}",
            imageUri: "",
            twitter: "",
            telegram: "",
            dexscreener: "",
            github: "",
            website: ""
          },
          proposals: []
        }]
      };

      (agentService as any).subgraphClient.request.mockResolvedValue(mockSubgraphResponse);

      const result = await agentService.getAgentsByOwner("0x456");
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Agent 1");
      expect(result[0].owner).toBe("0x456");
    });

    it("should allow searchAgents without signer", async () => {
      const mockSearchResponse = {
        agents: [{
          id: "0x123",
          name: "AI Agent",
          agentUri: "ipfs://test",
          owner: "0x456",
          reputation: "100000000000000000000",
          metadata: {
            id: "metadata1",
            name: "AI Agent",
            description: "AI Description",
            agentCategory: "ai",
            attributes: ["chatbot"],
            instructions: [],
            prompts: [],
            communicationType: "eliza",
            communicationParams: "{}",
            imageUri: "",
            twitter: "", telegram: "", dexscreener: "", github: "", website: ""
          },
          proposals: []
        }]
      };

      (agentService as any).subgraphClient.request.mockResolvedValue(mockSearchResponse);

      const result = await agentService.searchAgents("AI");
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("AI Agent");
      expect(result[0].agent).toBe("0x123");
    });

    it("should allow getReputation without signer", async () => {
      const mockReputation = BigInt(500);
      mockRegistry.getReputation.mockResolvedValue(mockReputation);

      const result = await agentService.getReputation("0x123");
      expect(result).toBe(mockReputation);
    });
  });

  describe("Write Operations Require Signer", () => {
    let agentService: AgentService;

    beforeEach(() => {
      agentService = new AgentService(
        mockRegistry,
        undefined, // No signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );
    });

    it("should throw error when getAgentAddress called without signer", async () => {
      await expect(agentService.getAgentAddress()).rejects.toThrow(
        "Signer required for write operations. Call setSigner() first."
      );
    });

    it("should throw error when registerAgent called without signer", async () => {
      const agentParams: RegisterAgentParams = {
        name: "Test Agent",
        description: "Test Description",
        category: "test",
        agentUri: "ipfs://test-agent-uri",
      };

      await expect(agentService.registerAgent("0x123", agentParams)).rejects.toThrow(
        "Signer required for write operations. Call setSigner() first."
      );
    });

    it("should throw error when registerAgentWithService called without signer", async () => {
      const agentParams: RegisterAgentParams = {
        name: "Test Agent",
        description: "Test Description",
        category: "test",
        agentUri: "ipfs://test-agent-uri",
      };

      await expect(agentService.registerAgentWithService(
        "0x123", 
        agentParams, 
        "TestService", 
        100
      )).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
    });

    it("should throw error when updateAgentMetadata called without signer", async () => {
      const metadata: AgentMetadata = {
        name: "Updated Agent",
        description: "Updated Description",
        imageURI: "",
        socials: {
          twitter: "", telegram: "", dexscreener: "", github: "", website: ""
        },
        agentCategory: "test",
        communicationType: "eliza",
        attributes: [],
        instructions: [],
        prompts: [],
      };

      await expect(agentService.updateAgentMetadata("0x123", metadata)).rejects.toThrow(
        "Signer required for write operations. Call setSigner() first."
      );
    });

    it("should throw error when addProposal called without signer", async () => {
      await expect(agentService.addProposal(
        "0x123", 
        "TestService", 
        100, 
        "0x456"
      )).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
    });

    it("should throw error when removeProposal called without signer", async () => {
      await expect(agentService.removeProposal("0x123", "1")).rejects.toThrow(
        "Signer required for write operations. Call setSigner() first."
      );
    });

    it("should throw error when updateAgentRecord called without signer", async () => {
      const updateData = {
        name: "Updated Name",
        description: "Updated Description"
      };

      await expect(agentService.updateAgentRecord("0x123", updateData)).rejects.toThrow(
        "Signer required for write operations. Call setSigner() first."
      );
    });

    it("should throw error when updateAgentRecordProperty called without signer", async () => {
      await expect(agentService.updateAgentRecordProperty(
        "0x123", 
        "name", 
        "New Name"
      )).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
    });
  });

  describe("Write Operations Work After setSigner", () => {
    let agentService: AgentService;

    beforeEach(() => {
      agentService = new AgentService(
        mockRegistry,
        undefined, // Start without signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      agentService.setSigner(mockSigner); // Add signer
    });

    it("should allow getAgentAddress after setSigner", async () => {
      const result = await agentService.getAgentAddress();
      expect(result).toBe("0x1234567890123456789012345678901234567890");
      expect(mockSigner.getAddress).toHaveBeenCalled();
    });

    it("should allow registerAgent after setSigner", async () => {
      const agentParams: RegisterAgentParams = {
        name: "Test Agent",
        description: "Test Description",
        category: "test",
        agentUri: "ipfs://test-agent-uri",
      };

      const mockTx = {
        wait: jest.fn().mockResolvedValue({ hash: "0xabc123" })
      };
      mockRegistry.registerAgent.mockResolvedValue(mockTx);

      const result = await agentService.registerAgent("0x123", agentParams);
      expect(result).toBe(true);
      expect(mockRegistry.registerAgent).toHaveBeenCalled();
    });

    it("should allow updateAgentMetadata after setSigner", async () => {
      const metadata: AgentMetadata = {
        name: "Updated Agent",
        description: "Updated Description",
        imageURI: "",
        socials: {
          twitter: "", telegram: "", dexscreener: "", github: "", website: ""
        },
        agentCategory: "test",
        communicationType: "eliza",
        attributes: [],
        instructions: [],
        prompts: [],
      };

      const mockTx = {
        hash: "0xabc123",
        wait: jest.fn().mockResolvedValue({ hash: "0xabc123" })
      };
      mockRegistry.setAgentData.mockResolvedValue(mockTx);

      const result = await agentService.updateAgentMetadata("0x123", metadata);
      expect(result).toBe(true);
      expect(mockIpfsSDK.upload.json).toHaveBeenCalledWith(metadata);
      expect(mockRegistry.setAgentData).toHaveBeenCalled();
    });

    it("should allow addProposal after setSigner", async () => {
      const mockTx = {
        wait: jest.fn().mockResolvedValue({ hash: "0xabc123" })
      };
      mockRegistry.addProposal.mockResolvedValue(mockTx);

      const result = await agentService.addProposal("0x123", "TestService", 100, "0x456");
      expect(result).toBe(true);
      expect(mockRegistry.addProposal).toHaveBeenCalledWith("0x123", "TestService", 100, "0x456");
    });
  });

  describe("Mixed Usage Scenarios", () => {
    it("should support agent discovery without signer, then enable registration with signer", async () => {
      const agentService = new AgentService(
        mockRegistry,
        undefined, // Start without signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      // Mock subgraph for discovery
      (agentService as any).subgraphClient = {
        request: jest.fn().mockResolvedValue({
          agents: [{
            id: "0x123",
            name: "Existing Agent",
            agentUri: "ipfs://existing",
            owner: "0x456",
            reputation: "100000000000000000000",
            metadata: {
              id: "metadata1",
              name: "Existing Agent",
              description: "Found via search",
              agentCategory: "existing",
              attributes: [],
              instructions: [],
              prompts: [],
              communicationType: "eliza",
              communicationParams: "{}",
              imageUri: "",
              twitter: "", telegram: "", dexscreener: "", github: "", website: ""
            },
            proposals: []
          }]
        })
      };

      // User can discover agents without signer
      const searchResults = await agentService.searchAgents("Existing");
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Existing Agent");

      // User connects wallet and can now register
      agentService.setSigner(mockSigner);

      const agentParams: RegisterAgentParams = {
        name: "New Agent",
        description: "Newly registered",
        category: "new",
        agentUri: "ipfs://new-agent-uri",
      };

      const mockTx = {
        wait: jest.fn().mockResolvedValue({ hash: "0xabc123" })
      };
      mockRegistry.registerAgent.mockResolvedValue(mockTx);

      const registrationResult = await agentService.registerAgent("0x789", agentParams);
      expect(registrationResult).toBe(true);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle signer-dependent operations gracefully when signer is removed", async () => {
      const agentService = new AgentService(
        mockRegistry,
        mockSigner, // Start with signer
        mockIpfsSDK,
        "https://test-subgraph.com"
      );

      // This should work
      const address = await agentService.getAgentAddress();
      expect(address).toBe("0x1234567890123456789012345678901234567890");

      // Remove signer by setting to undefined
      agentService.setSigner(undefined as any);

      // Now write operations should fail
      await expect(agentService.getAgentAddress()).rejects.toThrow(
        "Signer required for write operations. Call setSigner() first."
      );
    });
  });
});