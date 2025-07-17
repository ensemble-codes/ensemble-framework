# Ensemble CLI Architecture

## Overview

The Ensemble CLI is built using a modular architecture that separates concerns and provides a clean interface for managing agents, tasks, and services.

## Project Structure

```
packages/cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── agent/         # Agent management commands
│   │   ├── task/          # Task management commands
│   │   ├── service/       # Service management commands
│   │   ├── proposal/      # Proposal management commands
│   │   ├── config/        # Configuration commands
│   │   ├── wallet/        # Wallet management commands
│   │   └── listen/        # Event listening commands
│   ├── lib/               # Core libraries
│   │   ├── config.ts      # Configuration management
│   │   ├── wallet.ts      # Wallet management
│   │   ├── client.ts      # Ensemble SDK client wrapper
│   │   └── output.ts      # Output formatting
│   ├── types/             # Type definitions
│   │   └── index.ts       # All types (SDK + CLI-specific)
│   ├── utils/             # Utility functions
│   │   ├── validation.ts  # Input validation
│   │   ├── formatting.ts  # Output formatting helpers
│   │   ├── prompts.ts     # Interactive prompts
│   │   └── crypto.ts      # Cryptographic utilities
│   └── index.ts           # Main CLI entry point
├── bin/
│   └── ensemble.js        # Executable binary
├── test/                  # Test files
├── docs/                  # Documentation
└── package.json
```

## Key Components

### 1. Command System
- **BaseCommand**: Abstract base class for all commands
- **Commander.js**: Command parsing and routing
- **Modular Structure**: Each command category in its own directory

### 2. Configuration Management
- **Cascading Config**: User config → Global config → Defaults
- **Network Support**: Multiple network configurations
- **Wallet Management**: Secure credential storage
- **IPFS Integration**: Pinata configuration

### 3. SDK Integration
- **Client Wrapper**: Simplified SDK interface for CLI
- **Error Handling**: Graceful error handling and user feedback
- **Transaction Management**: Confirmation prompts and status tracking

### 4. Output System
- **Multiple Formats**: Table, JSON, CSV, YAML
- **Color Support**: Chalk for colored output
- **Progress Indicators**: Ora for loading spinners
- **Interactive Prompts**: Inquirer for user input

## Design Principles

1. **Reusability**: Maximum reuse of SDK types and functionality
2. **Modularity**: Clear separation of concerns
3. **User Experience**: Intuitive commands and helpful feedback
4. **Error Handling**: Graceful error handling with helpful messages
5. **Testability**: Comprehensive test coverage
6. **Extensibility**: Easy to add new commands and features

## Dependencies

### Core Dependencies
- **@ensemble-ai/sdk**: Core functionality
- **commander**: Command-line parsing
- **inquirer**: Interactive prompts
- **chalk**: Terminal colors
- **cli-table3**: Table formatting
- **ora**: Progress indicators

### Utility Dependencies
- **cosmiconfig**: Configuration file discovery
- **keytar**: Secure credential storage
- **fs-extra**: File system utilities
- **ethers**: Ethereum interactions
- **pinata-web3**: IPFS integration

## Development Workflow

1. **Setup**: Initialize project structure and dependencies
2. **Core Libraries**: Build configuration, wallet, and client wrappers
3. **Commands**: Implement command by command
4. **Testing**: Unit and integration tests
5. **Documentation**: User guides and API docs
6. **Distribution**: Package and publish

## Configuration File Schema

```json
{
  "version": "0.1.0",
  "networks": {
    "base-sepolia": {
      "chainId": 84532,
      "name": "Base Sepolia",
      "rpcUrl": "https://sepolia.base.org",
      "taskRegistryAddress": "0x...",
      "agentRegistryAddress": "0x...",
      "serviceRegistryAddress": "0x...",
      "subgraphUrl": "https://api.goldsky.com/...",
      "blockExplorer": "https://sepolia.basescan.org"
    }
  },
  "defaultNetwork": "base-sepolia",
  "wallets": {
    "default": {
      "address": "0x...",
      "type": "keystore",
      "encrypted": true
    }
  },
  "ipfs": {
    "pinataApiKey": "...",
    "pinataSecretKey": "..."
  },
  "preferences": {
    "outputFormat": "table",
    "confirmTransactions": true,
    "colorOutput": true
  }
}
```

## Command Categories

### Agent Management
- Register agents with metadata
- Update agent information
- List and search agents
- View agent details

### Task Management
- Create tasks with prompts
- Complete and rate tasks
- Monitor task status
- Cancel tasks

### Service Management
- Register services
- List available services
- View service details

### Proposal Management
- Add service proposals
- Remove proposals
- List active proposals

### Configuration
- Set configuration values
- Manage network settings
- Wallet configuration

### Monitoring
- Listen for blockchain events
- Real-time updates
- Event filtering

This architecture provides a solid foundation for building a comprehensive CLI tool that leverages the full power of the Ensemble SDK while providing an excellent user experience.