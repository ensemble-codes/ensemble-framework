import { AgentService } from "../src/services/AgentService";
import { AgentFilterParams } from "../src/types";
import { ethers } from "ethers";
import { AgentsRegistry } from "../typechain";

describe("AgentService Tests", () => {
  let agentService: AgentService;
  let mockRegistry: jest.Mocked<AgentsRegistry>;
  let mockSigner: jest.Mocked<ethers.Signer>;
  let mockSubgraphClient: any;

  beforeEach(() => {
    // Mock the AgentsRegistry
    mockRegistry = {
      getAgentData: jest.fn(),
      getReputation: jest.fn(),
    } as any;

    // Mock the signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue("0x1234567890123456789012345678901234567890"),
    } as any;

    // Create AgentService with mocked subgraph URL
    agentService = new AgentService(
      mockRegistry,
      mockSigner,
      undefined,
      "https://mock-subgraph-url.com"
    );

    // Mock the subgraph client
    mockSubgraphClient = {
      request: jest.fn(),
    };
    (agentService as any).subgraphClient = mockSubgraphClient;
  });

  describe("getAgentRecords", () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    it("should get agents with no filters", async () => {
      const mockResponse = {
        agents: [
          {
            id: "0x1234567890123456789012345678901234567890",
            name: "Test Agent",
            agentUri: "https://ipfs.io/ipfs/QmTest",
            owner: "0x0987654321098765432109876543210987654321",
            reputation: "4500000000000000000",
            metadata: {
              id: "meta1",
              name: "Test Agent",
              description: "A test agent",
              agentCategory: "test",
              openingGreeting: "Hello!",
              attributes: ["testing", "ai"],
              instructions: ["Step 1", "Step 2"],
              prompts: ["Test prompt"],
              communicationType: "websocket",
              communicationURL: "wss://testagent.com/ws",
              communicationParams: { timeout: 30000 },
              imageUri: "https://ipfs.io/ipfs/QmTestImage",
              twitter: "@testagent",
              telegram: "@testagent",
              dexscreener: "testagent",
              github: "testagent",
              website: "https://testagent.com"
            },
            proposals: []
          }
        ]
      };

      mockSubgraphClient.request.mockResolvedValue(mockResponse);

      const result = await agentService.getAgentRecords();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "Test Agent",
        address: "0x1234567890123456789012345678901234567890",
        description: "A test agent",
        category: "test",
        reputation: BigInt("4500000000000000000")
      });
    });

    it("should filter agents by owner", async () => {
      const filters: AgentFilterParams = {
        owner: "0x0987654321098765432109876543210987654321"
      };

      mockSubgraphClient.request.mockResolvedValue({ agents: [] });

      await agentService.getAgentRecords(filters);
      
      expect(mockSubgraphClient.request).toHaveBeenCalledTimes(1);
      expect(mockSubgraphClient.request).toHaveBeenCalledWith(
        expect.any(String),
        {}
      );
    });

    it("should filter agents by category", async () => {
      const filters: AgentFilterParams = {
        category: "ai-assistant"
      };

      mockSubgraphClient.request.mockResolvedValue({ agents: [] });

      await agentService.getAgentRecords(filters);
      
      expect(mockSubgraphClient.request).toHaveBeenCalledTimes(1);
      expect(mockSubgraphClient.request).toHaveBeenCalledWith(
        expect.any(String),
        {}
      );
    });

    it("should handle pagination", async () => {
      const filters: AgentFilterParams = {
        first: 10,
        skip: 5
      };

      mockSubgraphClient.request.mockResolvedValue({ agents: [] });

      await agentService.getAgentRecords(filters);
      
      expect(mockSubgraphClient.request).toHaveBeenCalledTimes(1);
      expect(mockSubgraphClient.request).toHaveBeenCalledWith(
        expect.any(String),
        {}
      );
    });

    it("should throw error when subgraph client is not initialized", async () => {
      const agentServiceWithoutSubgraph = new AgentService(
        mockRegistry,
        mockSigner
      );

      await expect(agentServiceWithoutSubgraph.getAgentRecords())
        .rejects.toThrow("Subgraph client is not initialized");
    });
  });

  describe("getAgentsByOwner", () => {
    it("should call getAgentRecords with owner filter", async () => {
      const ownerAddress = "0x1234567890123456789012345678901234567890";
      const spy = jest.spyOn(agentService, 'getAgentRecords').mockResolvedValue([]);

      await agentService.getAgentsByOwner(ownerAddress);

      expect(spy).toHaveBeenCalledWith({ owner: ownerAddress });
    });
  });

  describe("getAgentsByCategory", () => {
    it("should call getAgentRecords with category filter", async () => {
      const category = "ai-assistant";
      const first = 50;
      const skip = 10;
      const spy = jest.spyOn(agentService, 'getAgentRecords').mockResolvedValue([]);

      await agentService.getAgentsByCategory(category, first, skip);

      expect(spy).toHaveBeenCalledWith({ category, first, skip });
    });
  });

  describe("getAgentRecord", () => {
    it("should get single agent by address", async () => {
      const agentAddress = "0x1234567890123456789012345678901234567890";
      const mockResponse = {
        agent: {
          id: agentAddress,
          name: "Test Agent",
          agentUri: "https://ipfs.io/ipfs/QmTest",
          owner: "0x0987654321098765432109876543210987654321",
          reputation: "4500000000000000000",
          metadata: {
            id: "meta1",
            name: "Test Agent",
            description: "A test agent",
            agentCategory: "test",
            openingGreeting: "Hello!",
            attributes: ["testing", "ai"],
            instructions: ["Step 1", "Step 2"],
            prompts: ["Test prompt"],
            communicationType: "websocket",
            communicationURL: "wss://testagent.com/ws",
            communicationParams: { timeout: 30000 },
            imageUri: "https://ipfs.io/ipfs/QmTestImage",
            twitter: "@testagent",
            telegram: "@testagent",
            dexscreener: "testagent",
            github: "testagent",
            website: "https://testagent.com"
          },
          proposals: []
        }
      };

      mockSubgraphClient.request.mockResolvedValue(mockResponse);

      const result = await agentService.getAgentRecord(agentAddress);
      
      expect(result).toMatchObject({
        name: "Test Agent",
        address: agentAddress,
        description: "A test agent",
        category: "test"
      });
    });

    it("should throw error for invalid address", async () => {
      await expect(agentService.getAgentRecord("invalid-address"))
        .rejects.toThrow("Invalid Ethereum address");
    });

    it("should throw error when agent not found", async () => {
      const agentAddress = "0x1234567890123456789012345678901234567890";
      mockSubgraphClient.request.mockResolvedValue({ agent: null });

      await expect(agentService.getAgentRecord(agentAddress))
        .rejects.toThrow(`Agent not found at address: ${agentAddress}`);
    });
  });
});