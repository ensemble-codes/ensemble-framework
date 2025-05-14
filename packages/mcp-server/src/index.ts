import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import { AgentMatcher } from './services/agent-matcher';
import { config } from './config';
import pkg from '../package.json'
const { version } = pkg;
// Initialize the agent matcher service
const agentMatcher = new AgentMatcher();

// Create an MCP server
const server = new McpServer({
  id: 'ensemble-agent-matcher',
  name: 'Ensemble Agent Matcher',
  description: 'MCP server for finding and matching AI agents in the Ensemble network based on user requirements',
  version: version,
});

// Tool for finding agents that match a user's request
server.tool(
  'find-agents',
  'Gets a list for agents on Ensemble that match a user request',
  {
    query: z.string().describe('The user request or search query to find matching agents for'),
    limit: z.number().min(1).max(config.matching.maxLimit).optional()
      .describe(`Maximum number of agents to return (default: ${config.matching.defaultLimit})`),
    minReputationScore: z.number().min(0).optional()
      .describe('Minimum reputation score for agents (default: 0)'),
  },
  async ({ query, limit = config.matching.defaultLimit, minReputationScore = 0 }) => {
    try {
      const agents = await agentMatcher.findMatchingAgents(query, {
        limit,
        minReputationScore,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(agents, null, 2) }],
      };
    } catch (error) {
      console.error('Error finding agents:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error finding agents: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool for getting detailed information about a specific agent
// server.tool(
//   'getAgentDetails',
//   {
//     agentId: z.string().describe('The ID of the agent to get details for'),
//   },
//   async ({ agentId }) => {
//     try {
//       const agent = await agentMatcher.getAgentDetails(agentId);
      
//       if (!agent) {
//         return {
//           content: [
//             {
//               type: 'text',
//               text: `Agent with ID ${agentId} not found`,
//             },
//           ],
//         };
//       }

//       return {
//         content: [
//           {
//             type: 'application/json',
//             json: agent,
//           },
//         ],
//       };
//     } catch (error) {
//       console.error('Error getting agent details:', error);
//       return {
//         content: [
//           {
//             type: 'text',
//             text: `Error getting agent details: ${error instanceof Error ? error.message : String(error)}`,
//           },
//         ],
//       };
//     }
//   }
// );

// Resource to explain how to use this server
// server.resource('README', async () => {
//   return {
//     content: [
//       {
//         type: 'text',
//         text: `
// # Ensemble Agent Matcher MCP Server

// This is a Model Context Protocol (MCP) server that provides tools to find and match AI agents in the Ensemble network based on user requirements.

// ## Features

// - Searches for agents based on service descriptions as a priority
// - Falls back to agent descriptions when service matches are insufficient
// - Ranks agents by a scoring system that combines match relevance and agent reputation
// - Provides detailed agent information including proposals, services, and task history

// ## Tools

// ### findAgents

// Find agents that match a user's request, prioritizing:
// 1. Service descriptions first
// 2. Agent descriptions second

// \`\`\`typescript
// findAgents({
//   query: string;        // The user request or search query
//   limit?: number;       // Maximum number of agents to return (default: ${config.matching.defaultLimit})
//   minReputationScore?: number; // Minimum reputation score (default: 0)
// })
// \`\`\`

// Returns a list of matched agents sorted by relevance score.

// ### getAgentDetails

// Get detailed information about a specific agent.

// \`\`\`typescript
// getAgentDetails({
//   agentId: string;      // The ID of the agent to get details for
// })
// \`\`\`

// Returns comprehensive agent details including profile, proposals, tasks, and more.

// ## How Matching Works

// 1. The server first searches for services that match the user's query by examining service descriptions
// 2. For each matching service, it finds agents that offer this service through their proposals
// 3. Agents are scored based on their reputation plus a bonus for matching services
// 4. If more results are needed, the server searches for agents whose names or descriptions match the query
// 5. Results are sorted by score, with the highest scoring agents first
// `,
//       },
//     ],
//   };
// });



const transport = new StdioServerTransport();

server.connect(transport);

console.log(`MCP Server started on port ${config.server.port}`);

// server.sendLoggingMessage({
//   level: "info",
//   data: "Server started successfully",
// });