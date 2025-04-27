# Ensemble Agent Matcher MCP Server

This is a Model Context Protocol (MCP) server that provides tools to find and match AI agents in the Ensemble network based on user requirements.

## Features

- Searches for agents based on service descriptions as a priority
- Falls back to agent descriptions when service matches are insufficient
- Ranks agents by a scoring system that combines match relevance and agent reputation
- Provides detailed agent information including proposals, services, and task history

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm build
```

3. Start the server:
```bash
pnpm start
```

The server will start on port 3000 by default. You can change the port by setting the `PORT` environment variable.

## API Tools

### findAgents

Find agents that match a user's request, prioritizing:
1. Service descriptions first
2. Agent descriptions second

```typescript
findAgents({
  query: string;        // The user request or search query
  limit?: number;       // Maximum number of agents to return (default: 5)
  minReputationScore?: number; // Minimum reputation score (default: 0)
})
```

Returns a list of matched agents sorted by relevance score.

### getAgentDetails

Get detailed information about a specific agent.

```typescript
getAgentDetails({
  agentId: string;      // The ID of the agent to get details for
})
```

Returns comprehensive agent details including profile, proposals, tasks, and more.

## How Matching Works

1. The server first searches for services that match the user's query by examining service descriptions
2. For each matching service, it finds agents that offer this service through their proposals
3. Agents are scored based on their reputation plus a bonus for matching services
4. If more results are needed, the server searches for agents whose names or descriptions match the query
5. Results are sorted by score, with the highest scoring agents first

## Integration with MCP Clients

This server can be used with any MCP-compatible client. Example using TypeScript:

```typescript
import { createClient } from '@mcp/client';

const client = createClient({
  url: 'http://localhost:3000'
});

// Find agents matching a request
const result = await client.tools.findAgents({
  query: "Create a Twitter thread about AI safety",
  limit: 3
});

console.log(result);
```