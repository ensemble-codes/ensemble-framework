# Technical Context: Ensemble Framework

## Technology Stack

### Core Technologies
- **Solidity 0.8.20**: Primary smart contract language
- **Hardhat**: Development framework and testing environment
- **TypeScript**: Configuration and scripting language
- **OpenZeppelin**: Security-audited contract libraries
- **Ethers.js**: Ethereum interaction library

### Development Tools
- **Hardhat Toolbox**: Comprehensive development suite
- **Hardhat Ignition**: Declarative deployment system
- **Solidity Coverage**: Code coverage analysis
- **Chai**: Testing framework for JavaScript/TypeScript
- **dotenv**: Environment variable management

### Network Infrastructure
- **Base Mainnet**: Primary production deployment
- **Base Sepolia**: Testing and staging environment
- **Local Hardhat**: Development and unit testing

## Development Environment

### Prerequisites
- Node.js (LTS version recommended)
- pnpm package manager
- Git for version control
- Environment variables configuration

### Setup Commands
```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm run compile

# Run tests
pnpm run test

# Deploy to network
pnpm run deploy

# Verify contracts
pnpm run verify
```

### Configuration Files
- **hardhat.config.ts**: Network configurations and tooling setup
- **package.json**: Dependencies and script definitions
- **tsconfig.json**: TypeScript compiler configuration
- **.env**: Environment variables for deployment
- **.gitignore**: Version control exclusions

## Technical Constraints

### Gas Optimization
- **Target**: Minimize gas costs for all operations
- **Strategy**: Efficient storage layouts, optimized algorithms
- **Tools**: Gas reporter for monitoring consumption
- **Patterns**: Struct packing, batch operations where possible

### Security Requirements
- **Audit-Ready**: Code must be ready for professional security audits
- **Best Practices**: Follow established Solidity security patterns
- **Testing**: Comprehensive test coverage including edge cases
- **Dependencies**: Use only well-audited external libraries

### Scalability Considerations
- **Multi-Chain**: Support deployment across multiple EVM chains
- **Upgradability**: Contracts should support future improvements
- **Performance**: Efficient data structures for large-scale operations
- **Interoperability**: Clean interfaces for external integrations

## Network Configurations

### Base Sepolia (Testing)
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Verification**: Automated via Hardhat

### Base Mainnet (Production)
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Explorer**: https://basescan.org
- **Gas Strategy**: Optimized for efficiency

### Local Development
- **Chain ID**: 31337
- **Network**: Hardhat local node
- **Usage**: Unit testing and development
- **Reset**: Clean state for each test run

## Dependencies

### Production Dependencies
```json
{
  "@nomicfoundation/hardhat-ignition": "0.15.8",
  "@nomicfoundation/hardhat-toolbox": "^5.0.0",
  "@openzeppelin/contracts": "^5.1.0",
  "ensemble-sdk": "file:../sdk",
  "hardhat": "^2.22.18"
}
```

### Key Features
- **OpenZeppelin 5.1.0**: Latest security patterns and utilities
- **Ensemble SDK**: Custom SDK for framework integration
- **Hardhat Ignition**: Modern deployment management
- **Comprehensive Toolbox**: All necessary development tools

## Deployment Strategy

### Ignition Modules
- **TaskRegistry.ts**: Primary deployment module
- **Modular Approach**: Separate modules for each registry
- **Parameter Management**: Environment-specific configurations
- **Verification**: Automatic source code verification

### Environment Variables
```bash
PRIVATE_KEY=<deployment_key>
BASE_SEPOLIA_RPC_URL=<rpc_endpoint>
BASE_SEPOLIA_API_KEY=<api_key>
BASE_MAINNET_RPC_URL=<rpc_endpoint>
```

### Deployment Process
1. Configure environment variables
2. Run deployment via Hardhat Ignition
3. Verify contracts on block explorers
4. Update README with new addresses
5. Test deployed contracts with integration tests 