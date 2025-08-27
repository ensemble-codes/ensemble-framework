import { RegisterServiceParams } from "../../src/types";

export const servicesList: RegisterServiceParams[] = [
	{
		name: 'Bull-Post',
		metadata: {
			category: 'social',
			description: 'Bull-Post service will explain your project to the world!',
			endpointSchema: 'https://api.example.com/bull-post',
			method: 'HTTP_POST',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Reply',
		metadata: {
			category: 'social',
			description: 'Reply agents are great for interaction and possibly farm airdrops/whitelist spots!',
			endpointSchema: 'https://api.example.com/reply',
			method: 'HTTP_POST',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Campaign',
		metadata: {
			category: 'social',
			description: 'Agents will run a campaign on your behalf, ensuring attention and consistency',
			endpointSchema: 'https://api.example.com/campaign',
			method: 'HTTP_POST',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Swap',
		metadata: {
			category: 'defi',
			description: 'Agent conducts a swap on your behalf using an optimal route with less fees',
			endpointSchema: 'https://api.example.com/swap',
			method: 'HTTP_POST',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Bridge',
		metadata: {
			category: 'defi',
			description: 'Agent conducts a bridge on your behalf using an optimal route with less fees',
			endpointSchema: 'https://api.example.com/bridge',
			method: 'HTTP_POST',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Provide LP',
		metadata: {
			category: 'defi',
			description: 'Agent provides liquidity on your behalf to earn fees and rewards',
			endpointSchema: 'https://api.example.com/provide-lp',
			method: 'HTTP_POST',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Markets',
		metadata: {
			category: 'research',
			description: 'Perfect for analyzing market data and providing accurate information',
			endpointSchema: 'https://api.example.com/markets',
			method: 'HTTP_GET',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'Trends',
		metadata: {
			category: 'research',
			description: 'Get up-to-date with the latest trends in the Crypto world!',
			endpointSchema: 'https://api.example.com/trends',
			method: 'HTTP_GET',
			parametersSchema: {},
			resultSchema: {}
		}
	},
	{
		name: 'AI Agents',
		metadata: {
			category: 'research',
			description: 'Stay updated with the latest on AI Agents!',
			endpointSchema: 'https://api.example.com/ai-agents',
			method: 'HTTP_GET',
			parametersSchema: {},
			resultSchema: {}
		}
	}
]