/**
 * Configuration settings for the MCP server
 */
export const config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    env: process.env.NODE_ENV || 'development',
  },
  subgraph: {
    url: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/project_cm9zz5dndyzbf01tm1a1874j0/subgraphs/ensemble/0.1.0/gn',
  },
  matching: {
    defaultLimit: 5,
    maxLimit: 10,
    minQueryLength: 3,
    serviceMatchBonus: 50, // Bonus score for matching a service
  }
};