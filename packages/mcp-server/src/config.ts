/**
 * Configuration settings for the MCP server
 */
export const config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    env: process.env.NODE_ENV || 'development',
  },
  subgraph: {
    url: process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/78363/ensemble-v2/version/latest',
  },
  matching: {
    defaultLimit: 5,
    maxLimit: 10,
    minQueryLength: 3,
    serviceMatchBonus: 50, // Bonus score for matching a service
  }
};