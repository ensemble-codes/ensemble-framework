# Upgradeable Registry Contracts Deployment Guide

This guide explains how to deploy and upgrade the registry contracts using Hardhat Ignition with the UUPS proxy pattern.

## Overview

The Ensemble Framework registry contracts have been converted to upgradeable versions using OpenZeppelin's UUPS (Universal Upgradeable Proxy Standard) pattern. This allows for contract logic updates while preserving state and addresses.

### Contracts

- **ServiceRegistryUpgradeable**: Manages service registrations
- **AgentsRegistryUpgradeable**: Manages agent registrations and proposals
- **TaskRegistryUpgradeable**: Manages task lifecycle and payments

## Prerequisites

1. **Dependencies installed**: Ensure you have the required packages:
   ```bash
   npm install --save-dev @openzeppelin/hardhat-upgrades @openzeppelin/contracts-upgradeable
   ```

2. **Hardhat Ignition**: The project uses Hardhat Ignition for deployment:
   ```bash
   # Already included in the project
   @nomicfoundation/hardhat-ignition-ethers
   ```

## Deployment

### 1. Deploy All Contracts

Deploy all three registry contracts with proper dependency management:

```bash
# Deploy to local network (for testing)
npx hardhat ignition deploy ignition/modules/TaskRegistryUpgradeable.ts --network localhost

# Deploy to Base Sepolia testnet
npx hardhat ignition deploy ignition/modules/TaskRegistryUpgradeable.ts --network baseSepolia --parameters ignition/params/baseSepolia.json
```

### 2. Deploy Individual Contracts

You can also deploy contracts individually:

```bash
# Deploy only ServiceRegistry
npx hardhat ignition deploy ignition/modules/ServiceRegistryUpgradeable.ts --network localhost

# Deploy ServiceRegistry + AgentsRegistry
npx hardhat ignition deploy ignition/modules/AgentsRegistryUpgradeable.ts --network localhost
```

### 3. Using Parameters

Configure deployment parameters in `ignition/params/`:

```json
{
  "AgentsRegistryUpgradeableModule": {
    "v1RegistryAddress": "0x0000000000000000000000000000000000000000"
  },
  "TaskRegistryUpgradeableModule": {
    "initialTaskId": 1
  }
}
```

## Upgrade Process

### 1. Deploy New Implementations

When you need to upgrade contracts, use the upgrade module:

```bash
npx hardhat ignition deploy ignition/modules/UpgradeRegistries.ts --network baseSepolia --parameters upgrade-params.json
```

### 2. Upgrade Parameters

Create an upgrade parameters file:

```json
{
  "UpgradeRegistriesModule": {
    "serviceRegistryProxy": "0x...",
    "agentsRegistryProxy": "0x...",
    "taskRegistryProxy": "0x..."
  }
}
```

### 3. Verification

After deployment/upgrade, verify the contracts:

```bash
# Check deployment status
npx hardhat ignition status chain-<chainId>

# List all deployments
npx hardhat ignition deployments
```

## Architecture Details

### UUPS Proxy Pattern

- **Implementation Contracts**: Contain the actual logic
- **Proxy Contracts**: Store state and delegate calls to implementations
- **Upgrade Logic**: Built into the implementation contracts
- **Access Control**: Only contract owners can authorize upgrades

### Deployment Flow

1. **ServiceRegistry**: Deployed first (no dependencies)
2. **AgentsRegistry**: Depends on ServiceRegistry
3. **TaskRegistry**: Depends on AgentsRegistry

### Storage Safety

All upgradeable contracts include:
- **Storage gaps**: 50 slots reserved for future variables
- **Initializer modifiers**: Prevent multiple initialization
- **Proper inheritance**: Compatible with OpenZeppelin patterns

## Security Considerations

### Access Control

- **Proxy Ownership**: Deployer initially owns all proxies
- **Upgrade Authorization**: Only owners can upgrade contracts
- **Role Management**: Contracts use OpenZeppelin's AccessControl

### Best Practices

1. **Test Upgrades**: Always test on testnets first
2. **Storage Layout**: Never reorder or remove existing variables
3. **Initialization**: New variables should be initialized in upgrade functions
4. **Timelock**: Consider using TimelockController for production upgrades

## Troubleshooting

### Common Issues

1. **ID Conflicts**: Ensure unique IDs in Ignition modules
2. **Storage Collisions**: Follow OpenZeppelin upgrade patterns
3. **Initialization Errors**: Check parameter types and values

### Debug Commands

```bash
# Show detailed error information
npx hardhat ignition deploy --show-stack-traces

# Compile contracts first
npx hardhat compile

# Run tests to verify functionality
npx hardhat test
```

## Example Deployment Output

```
Hardhat Ignition 🚀

Deploying [ TaskRegistryUpgradeableModule ]

Batch #1
  Executed ServiceRegistryUpgradeableModule#ServiceRegistryImpl
  Executed AgentsRegistryUpgradeableModule#AgentsRegistryImpl
  Executed TaskRegistryUpgradeableModule#TaskRegistryImpl

...

[ TaskRegistryUpgradeableModule ] successfully deployed 🚀

Deployed Addresses

ServiceRegistryUpgradeableModule#ServiceRegistryProxy - 0x...
AgentsRegistryUpgradeableModule#AgentsRegistryProxy - 0x...
TaskRegistryUpgradeableModule#TaskRegistryProxy - 0x...
```

## Integration with Tests

The upgradeable contracts work with existing tests:

```typescript
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ignition } from "hardhat";
import TaskRegistryUpgradeableModule from "../ignition/modules/TaskRegistryUpgradeable";

describe("Upgradeable Registry Tests", function () {
  async function deployFixture() {
    const { taskRegistry, agentsRegistry, serviceRegistry } = 
      await ignition.deploy(TaskRegistryUpgradeableModule);
    
    return { taskRegistry, agentsRegistry, serviceRegistry };
  }

  it("should maintain functionality after upgrade", async function () {
    const { taskRegistry } = await loadFixture(deployFixture);
    // Test contract functionality...
  });
});
```

## Next Steps

1. **Test Deployment**: Deploy to local network and verify functionality
2. **Testnet Deployment**: Deploy to Base Sepolia for integration testing
3. **Production Deployment**: Deploy to mainnet with proper security measures
4. **Monitoring**: Set up monitoring for deployed contracts
5. **Documentation**: Update API documentation with new addresses

For more information, see:
- [OpenZeppelin Upgrades Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [Hardhat Ignition Documentation](https://hardhat.org/ignition/docs)
- [UUPS Proxy Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) 