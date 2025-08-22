import { Ensemble } from "../src/ensemble";
import { ethers } from "ethers";

// Basic integration test for optional signer functionality
describe("Optional Signer Basic Integration", () => {
  const mockConfig = {
    serviceRegistryAddress: "0x123",
    agentRegistryAddress: "0x456", 
    taskRegistryAddress: "0x789",
    subgraphUrl: "https://test-subgraph.com"
  };

  it("should create SDK without signer", () => {
    const ensemble = Ensemble.create(mockConfig);
    expect(ensemble).toBeInstanceOf(Ensemble);
  });

  it("should create SDK with signer", () => {
    const mockSigner = {} as ethers.Signer;
    const ensemble = Ensemble.create(mockConfig, mockSigner);
    expect(ensemble).toBeInstanceOf(Ensemble);
  });

  it("should allow setting signer after creation", () => {
    const ensemble = Ensemble.create(mockConfig);
    const mockSigner = {} as ethers.Signer;
    
    expect(() => ensemble.setSigner(mockSigner)).not.toThrow();
  });

  it("should throw error for write operation without signer", async () => {
    const ensemble = Ensemble.create(mockConfig);
    
    await expect(ensemble.createTask({
      prompt: "test",
      proposalId: "1"
    })).rejects.toThrow("Signer required for write operations. Call setSigner() first.");
  });

  it("should throw error for getWalletAddress without signer", async () => {
    const ensemble = Ensemble.create(mockConfig);
    
    await expect(ensemble.getWalletAddress()).rejects.toThrow(
      "Signer required for write operations. Call setSigner() first."
    );
  });
});