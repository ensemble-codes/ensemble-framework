import Fastify from 'fastify';
import agentRoutes from '../routes/agents';

export async function build() {
  const app = Fastify({
    logger: false
  });

  // Add config to the Fastify instance with valid test values
  app.decorate('config', {
    NETWORK_RPC_URL: process.env.RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/test-key',
    AGENT_REGISTRY_ADDRESS: process.env.AGENT_REGISTRY_ADDRESS || '0xDbF645cC23066cc364C4Db915c78135eE52f11B2',
    SERVICE_REGISTRY_ADDRESS: process.env.SERVICE_REGISTRY_ADDRESS || '0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244',
    TASK_REGISTRY_ADDRESS: process.env.TASK_REGISTRY_ADDRESS || '0x847fA49b999489fD2780fe2843A7b1608106b49b',
    ENSEMBLE_SUBGRAPH_URL: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/project_cmcnps2k01akp01uobifl4bby/subgraphs/ensemble-subgraph/0.0.5/gn'
  });

  // Register routes
  await app.register(agentRoutes);

  return app;
}