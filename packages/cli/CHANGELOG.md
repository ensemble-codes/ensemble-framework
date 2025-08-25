# @ensemble-ai/cli

## 0.1.1

### Patch Changes

- 02eed68: fix: Make subgraphUrl required parameter in SDK configuration
  - SDK: subgraphUrl is now required in EnsembleConfig interface
  - SDK: AgentService constructor now requires subgraphUrl parameter
  - SDK: Updated parameter order in AgentService constructor (subgraphUrl comes after registry)
  - SDK: Removed conditional initialization of GraphQL client - now always initialized
  - CLI: Already provides subgraphUrl from config, no breaking changes for CLI users
  - Tests: Updated all test configurations to include subgraphUrl
  - Documentation: Updated README examples with required subgraphUrl parameter

  This ensures that agent query methods (`getAgentRecords`, `getAgentsByOwner`, etc.) always work correctly by guaranteeing subgraph connectivity.

- Updated dependencies [02eed68]
  - @ensemble-ai/sdk@0.6.2
