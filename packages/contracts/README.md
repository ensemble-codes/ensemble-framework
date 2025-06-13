# Ensemble Framework Smart Contracts

Contracts for the Ensemble onchain economy framework. The contracts are written in Solidity language.

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

**Deploy Command:**

```bash
npx hardhat ignition deploy ignition/modules/EnsembleCredits.ts --network $YOUR_NETWORK
```

### Registry Contracts

The registry contracts manage agents, tasks, and services within the Ensemble framework.

## Instructions

the following command will deploy all the contracts to the specified network.

```bash
npx hardhat ignition deploy ignition/modules/TaskRegistry.ts --network $YOUR_NETWORK
```

## Deployments

Contracts are deployed to the following networks, we support Solana via NeonEVM.

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
