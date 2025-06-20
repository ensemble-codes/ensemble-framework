# Agent Unregister Functionality Specification

## Overview
The `unregisterAgent` function allows agent owners to completely remove their agents from the AgentsRegistry system, including all associated proposals and data.

## Function Signature
```solidity
function unregisterAgent(address agent) external onlyAgentOwner(agent)
```

## Parameters
- `agent`: The address of the agent to unregister

## Access Control
- **Modifier**: `onlyAgentOwner(agent)` - Only the owner of the agent can unregister it
- **Visibility**: `external` - Can be called from outside the contract

## Prerequisites
- The agent must be registered in the system
- The caller must be the owner of the agent

## Functionality

### Core Operations
1. **Validation**: Ensures the agent is registered
2. **Proposal Cleanup**: Removes all active proposals associated with the agent
3. **Data Deletion**: Clears all agent data from storage
4. **Event Emission**: Emits events for tracking

### Detailed Process
1. Validates that `agents[agent].agent != address(0)` (agent exists)
2. Stores the agent owner address for event emission
3. Calls `_removeAllAgentProposals(agent)` to clean up proposals
4. Deletes the agent data using `delete agents[agent]`
5. Emits `AgentUnregistered` event

### Proposal Cleanup Process
The internal `_removeAllAgentProposals` function:
- Iterates through all proposal IDs from 1 to `nextProposalId - 1`
- For each proposal where `issuer == agent` and `isActive == true`:
  - Deletes the proposal data
  - Emits `ProposalRemoved` event

## Events Emitted

### AgentUnregistered
```solidity
event AgentUnregistered(
    address indexed agent,
    address indexed owner
);
```
- **agent**: The address of the unregistered agent
- **owner**: The address of the agent's owner

### ProposalRemoved (for each removed proposal)
```solidity
event ProposalRemoved(
    address indexed agent,
    uint256 indexed proposalId
);
```
- **agent**: The address of the agent whose proposal was removed
- **proposalId**: The ID of the removed proposal

## Error Conditions

### "Not the owner of the agent"
- **Cause**: Caller is not the owner of the specified agent
- **Trigger**: `onlyAgentOwner` modifier fails

### "Agent not registered"
- **Cause**: The specified agent address is not registered
- **Trigger**: `agents[agent].agent == address(0)`

## State Changes

### Agent Data Cleared
All fields in the `AgentData` struct are reset to default values:
- `agent`: `address(0)`
- `owner`: `address(0)`
- `name`: `""`
- `agentUri`: `""`
- `reputation`: `0`
- `totalRatings`: `0`

### Proposals Removed
All active proposals where `issuer == agent` are deleted:
- `issuer`: `address(0)`
- `serviceName`: `""`
- `price`: `0`
- `token`: `address(0)`
- `proposalId`: `0`
- `isActive`: `false`

## Post-Unregister Behavior

### Re-registration Allowed
- The same agent address can be registered again after unregistration
- New registration starts with fresh data (reputation reset to 0)
- Previous proposal history is not retained

### Data Isolation
- Unregistering one agent does not affect other agents' data
- Other agents' reputation and proposals remain intact

## Gas Considerations

### Variable Gas Cost
- Base cost for agent data deletion: ~5,000 gas
- Additional cost per proposal removed: ~5,000 gas
- Total cost scales with number of active proposals

### Optimization Notes
- Function iterates through all proposal IDs to find agent's proposals
- Gas cost increases with total number of proposals in the system
- Consider proposal indexing for future optimization if needed

## Integration Points

### TaskRegistry Integration
- No direct integration with TaskRegistry for unregistration
- Reputation data is cleared but TaskRegistry may retain historical records
- Future tasks cannot be assigned to unregistered agents

### ServiceRegistry Integration
- No impact on ServiceRegistry
- Services remain registered even if all agents providing them are unregistered

## Security Considerations

### Access Control
- Strong access control through `onlyAgentOwner` modifier
- Prevents unauthorized unregistration

### State Consistency
- Complete cleanup ensures no orphaned data
- All related proposals are properly removed

### Reentrancy Protection
- Function is protected by existing contract patterns
- No external calls that could cause reentrancy

## Usage Examples

### Basic Unregistration
```solidity
// Agent owner unregisters their agent
agentsRegistry.unregisterAgent(agentAddress);
```

### Re-registration After Unregistration
```solidity
// Unregister
agentsRegistry.unregisterAgent(agentAddress);

// Re-register with new data
agentsRegistry.registerAgent(
    agentAddress,
    "New Agent Name",
    "https://new-uri.com"
);
```

## Testing Coverage

### Positive Test Cases
- ✅ Successfully unregister agent with proposals
- ✅ Successfully unregister agent without proposals
- ✅ Remove multiple proposals when unregistering
- ✅ Allow re-registration after unregistering
- ✅ Preserve other agents' data when unregistering one agent

### Negative Test Cases
- ✅ Prevent non-owner from unregistering agent
- ✅ Prevent unregistering non-existent agent

### Edge Cases
- ✅ Handle agent with no active proposals
- ✅ Handle agent with some proposals already manually removed
- ✅ Preserve reputation data for other agents

## Future Enhancements

### Potential Optimizations
1. **Proposal Indexing**: Maintain agent-to-proposal mapping for O(1) cleanup
2. **Batch Operations**: Allow unregistering multiple agents in one transaction
3. **Graceful Unregistration**: Add cooldown period or confirmation mechanism

### Additional Features
1. **Unregistration Reason**: Optional reason parameter for tracking
2. **Recovery Mechanism**: Temporary suspension instead of permanent removal
3. **Historical Data**: Maintain unregistration history for analytics 