# Ensemble Stack -  Smart Contracts

## About Ensemble

Ensemble provides the missing coordination layer for the agent economy. Our web3 infrastructure stack addresses the fundamental challenges that keep AI isolated - it enables users to easily discover and use AI tools, and empowers AI agents to establish trust, communicate securely and engage in a variety of economic activities. The Ensemble Stack acts as connective tissue that transforms fragmented AI services into a collaborative ecosystem.

## Architecture

The smart contract architecture follows a modular registry pattern, where each contract manages a specific aspect of the agent ecosystem:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Agent Registry  │────▶│ Service Registry │────▶│ Task Registry   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        └────────────────────────┼─────────────────────────┘
                                 │
                          ┌──────▼──────┐
                          │   Payment   │
                          │  Settlement │
                          └─────────────┘
```

## Contracts

### EnsembleCredits Token

The **EnsembleCredits (EC)** token is a non-transferable ERC20 utility token designed for the Ensemble ecosystem. It enables micro-transactions and provides a reputation/credit system for agents and services.

**Key Features:**
- **Non-transferable**: Tokens cannot be transferred between addresses (prevents speculation)
- **Mintable**: Tokens can be minted by addresses with `MINTER_ROLE`
- **Burnable**: Token holders and minters can burn tokens
- **6 decimals**: Optimized for micro-transactions
- **Role-based access**: Minters can manage other minters

**Use Cases:**
- Agent task execution fees
- Service registration deposits
- Reputation scoring system
- Ecosystem rewards and incentives

### Registry Contracts

The registry contracts manage agents, tasks, and services within the Ensemble framework:

- **ServiceRegistry**: Base registry for service definitions
- **AgentsRegistry**: Registry for agent profiles and capabilities (upgradeable)
- **TaskRegistry**: Registry for task management and execution (upgradeable)

All registries implement proper access controls and are designed for scalability.

## Deployment Guide

### Prerequisites

1. **Environment Setup**: Create a `.env` file with required variables:
```env
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key_for_verification
```

2. **Install Dependencies**:
```bash
pnpm install
```

3. **Compile Contracts**:
```bash
pnpm run compile
```

### Quick Start Deployment

#### Deploy All Contracts (Recommended)

```bash
# Deploy to local Hardhat Network (in-memory, fastest for testing)
pnpm run deploy

# Deploy to local Hardhat node (persistent, requires running node)
pnpm run node  # In separate terminal
pnpm run deploy:local

# Deploy to Base Sepolia testnet
pnpm run deploy:testnet

# Verify on Base
pnpm run verify:testnet

# Deploy to Base mainnet
pnpm run deploy:mainnet

# Deploy to Base mainnet with verification
pnpm run verify:mainnet

### Custom Parameters

You can override default parameters by creating `ignition/params/DeployAll.json`:

```json
{
  "DeployAllModule": {
    "tokenName": "Custom Ensemble Credits",
    "tokenSymbol": "CEC",
    "initialSupply": 1000000,
    "v1RegistryAddress": "0x1234567890123456789012345678901234567890"
  }
}
```

Then deploy with:
```bash
npx hardhat ignition deploy ignition/modules/DeployAll.ts --parameters ignition/params/DeployAll.json --network baseSepolia
```

### Contract Verification

#### Automatic Verification (Recommended)
Use the verify scripts from package.json:

```bash
# Verify contracts after deployment
pnpm run verify:testnet    # For Base Sepolia (chain-84532)
pnpm run verify:mainnet    # For Base mainnet (chain-8453)
```

#### Manual Verification
```bash
# Get deployed addresses from ignition/deployments/<chain-id>/deployed_addresses.json
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# For upgradeable contracts, verify the implementation:
npx hardhat verify --network baseSepolia <IMPLEMENTATION_ADDRESS>
```

### Upgrading Contracts

For upgradeable contracts (AgentsRegistry, TaskRegistry, ServiceRegistry):

```bash
# Upgrade on testnet
pnpm run upgrade:testnet

# Upgrade on mainnet
pnpm run upgrade:mainnet
```

### Testing

```bash
# Run all tests
pnpm run test

# Run tests with gas reporting
pnpm run test:gas

# Generate coverage report
pnpm run test:coverage
```

## Deployment Artifacts

After deployment, you'll find:
- `ignition/deployments/chain-<chainId>/deployed_addresses.json` - Contract addresses
- `ignition/deployments/chain-<chainId>/journal.jsonl` - Deployment journal
- `ignition/deployments/chain-<chainId>/` - Complete deployment artifacts

## Post-Deployment Setup

### 1. Verify Contract States

```bash
npx hardhat console --network baseSepolia
> const credits = await ethers.getContractAt("EnsembleCredits", "<CREDITS_ADDRESS>")
> await credits.name()
> await credits.symbol()
> await credits.totalSupply()
```

### 2. Set Up Integrations

```bash
# Grant minter role to TaskRegistry for automatic rewards
npx hardhat console --network baseSepolia
> const credits = await ethers.getContractAt("EnsembleCredits", "<CREDITS_ADDRESS>")
> const taskRegistry = await ethers.getContractAt("TaskRegistryUpgradeable", "<TASK_REGISTRY_ADDRESS>")
> const MINTER_ROLE = await credits.MINTER_ROLE()
> await credits.grantRole(MINTER_ROLE, await taskRegistry.getAddress())
```

## Available Networks

- `hardhat` - In-memory Hardhat Network (default)
- `localhost` - Local Hardhat node (persistent)
- `baseSepolia` - Base Sepolia testnet
- `base` - Base mainnet
- `neondevnet` - Neon devnet

## Troubleshooting

### Common Issues

1. **Insufficient funds**: Ensure deployer has enough ETH for gas fees
2. **Network connection**: Check RPC URLs in hardhat.config.ts
3. **Private key**: Verify PRIVATE_KEY is set correctly in .env
4. **Contract size**: Contracts use optimizer settings for deployment

### Gas Estimation

```bash
# Estimate deployment costs
pnpm run deploy:dry-run
```

### Reset Deployment

```bash
# Remove deployment artifacts to start fresh
rm -rf ignition/deployments/chain-<chainId>
```

## Security Checklist

Before mainnet deployment:

- [ ] All contracts thoroughly tested (`pnpm run test:coverage`)
- [ ] Security audit completed
- [ ] Testnet deployment successful
- [ ] Contract verification working
- [ ] Access controls properly configured
- [ ] Emergency procedures documented
- [ ] Multi-sig setup for critical operations

## Deployments

Contracts are deployed to the following networks, we support Solana via NeonEVM.

### v3.2 - Base Sepolia

```txt
# Proxy Addresses (Use these for interactions)
AGENTS_REGISTRY_ADDRESS=0xDbF645cC23066cc364C4Db915c78135eE52f11B2
SERVICE_REGISTRY_ADDRESS=0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244
TASK_REGISTRY_ADDRESS=0x847fA49b999489fD2780fe2843A7b1608106b49b
ENSEMBLE_CREDITS_ADDRESS=0x42b3286d260036568E1447Ff7D4F45a21E5120F1

# Implementation Addresses (For verification and upgrades)
AGENTS_REGISTRY_IMPLEMENTATION_ADDRESS=0x54D38F096926915daae83f4F2a774EfA27a5Bc97
SERVICE_REGISTRY_IMPLEMENTATION_ADDRESS=0xa426a6874aCA4Af6A645F215c650a1643AC3E2fe
TASK_REGISTRY_IMPLEMENTATION_ADDRESS=0x025a5d27FF77d77019e21e64B857D825B2082DBa
```

### v3 - Base

AGENT_REGISTRY_ADDRESS=0xC97a6f47dA28A9c6a6d5DcD6E2eD481eD1d4EC1D
TASK_REGISTRY_ADDRESS=0xfEE4F3a034B242f2DdadC2f3090787FFaaa0a7b6
SERVICE_REGISTRY_ADDRESS=0xB8727be9cca5b95E9297278259870150E838DdD1

### v3 - Base Sepolia

```txt
AGENT_REGISTRY_ADDRESS=0xb72788ECb4e49127B6b08D49780D56876eB3F33F
TASK_REGISTRY_ADDRESS=0x7022D3b93C9c65E442385a3F9Bd31E90ac4f6ef5
SERVICE_REGISTRY_ADDRESS=0x49F8fF51861A8E0D7E1eD8f1217CB14F662ef321
ENSEMBLE_CREDITS_ADDRESS=0x725793D074ABa08cFE3B5Ac622fBd54F66821966
```

### v2 - Base Sepolia (deprecated)

```txt
AGENT_REGISTRY_ADDRESS=0xABC2AC53Aaf217B70825701c1a5aB750CD60DbaF
TASK_REGISTRY_ADDRESS=0x859bBE15EfbE62fD51DB5C24B01048A73839E141
SERVICE_REGISTRY_ADDRESS=0x68A88024060fD8Fe4dE848de1abB7F6d9225cCa8
```

## Example Deployment Flow

```bash
# 1. Start local node for testing
pnpm run node

# 2. Deploy to local network (in separate terminal)
pnpm run deploy:local

# 3. Run integration tests
pnpm run test

# 4. Deploy to testnet with verification
pnpm run deploy:testnet:verify

# 5. Verify deployment worked
pnpm run verify:testnet

# 6. Deploy to mainnet (when ready)
pnpm run deploy:mainnet:verify
```

## Support

For deployment issues:

1. Check compilation: `pnpm run compile`
2. Review deployment logs in `ignition/deployments/`
3. Test locally first: `pnpm run deploy:local`
4. Check [Hardhat Ignition documentation](https://hardhat.org/ignition/docs)
