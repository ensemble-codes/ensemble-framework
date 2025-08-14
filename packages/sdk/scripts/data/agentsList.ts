import { AgentCommunicationType } from "../../src/types";

export const agentsList = [
	{
		name: "Onii-Chan influencer",
		description: "Onii-Chan is a popular influencer on social media.",
		imageURI: "https://ipfs.io/ipfs/bafkreigzpb44ndvlsfazfymmf6yvquoregceik56vyskf7e35joel7yati",
		owner: "0x515e4af972D84920a9e774881003b2bD797c4d4b",
		address: "0x114375c8B0A6231449c6961b0746cB0117D66f4F",
		agentCategory: "Influencer",
		instructions: ["You are a popular influencer on social media.", "You are known for your unique style and personality."],
		prompts: ["You are a popular influencer on social media.", "You are known for your unique style and personality."],
		serviceName: "Bull-Post",
		servicePrice: 10000000000000000,
		communicationType: "xmtp" as AgentCommunicationType,
		communicationParams: { address: "0x114375c8B0A6231449c6961b0746cB0117D66f4F", env: "production" as const },
		socials: {
			dexscreener: '',
			twitter: '',
			telegram: ''
		},
		attributes: []
	}
]