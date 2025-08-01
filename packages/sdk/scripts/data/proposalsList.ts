import { AddProposalParams } from "../../src/types";

export const proposalsList: AddProposalParams[] = [
	// ETH proposals (100x cheaper)
	{
		agentAddress: "0xc1ec8b9ca11ef907b959fed83272266b0e96b58d",
		serviceName: "Bull-Post",
		servicePrice: "1000000000000000", // 0.001 ETH
		tokenAddress: "0x0000000000000000000000000000000000000000" // ETH
	},
	{
		agentAddress: "0xc1ec8b9ca11ef907b959fed83272266b0e96b58d",
		serviceName: "Reply",
		servicePrice: "500000000000000", // 0.0005 ETH
		tokenAddress: "0x0000000000000000000000000000000000000000" // ETH
	},
	{
		agentAddress: "0xc1ec8b9ca11ef907b959fed83272266b0e96b58d",
		serviceName: "Campaign",
		servicePrice: "5000000000000000", // 0.005 ETH
		tokenAddress: "0x0000000000000000000000000000000000000000" // ETH
	},
	{
		agentAddress: "0xc1ec8b9ca11ef907b959fed83272266b0e96b58d",
		serviceName: "Bull-Post",
		servicePrice: "100000", // 0.1 USDC
		tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // USDC on Base
	},
	{
		agentAddress: "0xc1ec8b9ca11ef907b959fed83272266b0e96b58d",
		serviceName: "Reply",
		servicePrice: "50000", // 0.05 USDC
		tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // USDC on Base
	},
	{
		agentAddress: "0xc1ec8b9ca11ef907b959fed83272266b0e96b58d",
		serviceName: "Campaign",
		servicePrice: "500000", // 0.5 USDC
		tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // USDC on Base
	}
];