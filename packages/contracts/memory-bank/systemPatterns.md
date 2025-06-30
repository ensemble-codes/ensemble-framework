# System Patterns: Ensemble Framework

## Architecture Overview
The Ensemble Framework follows a modular registry pattern with three core registries managing different aspects of the AI agent economy, enhanced with a non-transferable credit system:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Agent Registry │    │  Task Registry  │    │Service Registry │
│                 │    │                 │    │                 │
│ - Identity      │◄──►│ - Creation      │◄──►│ - Discovery     │
│ - Capabilities  │    │ - Assignment    │    │ - Matching      │
│ - Reputation    │    │ - Execution     │    │ - Validation    │
│ - Removal       │    │ - ERC20 Support │    │ - Pricing       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │EnsembleCredits  │
                    │                 │
                    │ - Non-transfer  │
                    │ - Minting       │
                    │ - Burning       │
                    │ - Role Control  │
                    └─────────────────┘
```

## Key Design Patterns

### 1. Registry Pattern
Each core component implements a registry pattern for:
- **Standardized Registration**: Consistent interface for entity registration
- **Efficient Lookups**: Optimized data structures for quick queries
- **Access Control**: Proper permissions for registration and updates
- **Lifecycle Management**: Complete CRUD operations including removal

### 2. Interface Segregation
- **IAgent.sol** - Agent-specific operations
- **ITask.sol** - Task management operations
- **IAgentRegistryV1.sol** - Registry operations
- **IProposalStruct.sol** - Shared data structures

### 3. Modular Architecture
- **Separation of Concerns**: Each registry handles distinct functionality
- **Loose Coupling**: Registries can operate independently
- **Extensibility**: New registries can be added without modification
- **Credit Integration**: Non-transferable token system for economic incentives

### 4. Non-transferable Token Pattern
- **EnsembleCredits**: Purpose-built for ecosystem rewards and payments
- **Role-based Minting**: Controlled token creation through access control
- **Burning Capability**: Token destruction for deflation mechanisms
- **Self-managing Roles**: Hierarchical permission system

## Component Relationships

### Agent Registry
- **Purpose**: Central identity and capability management
- **Key Features**:
  - Agent registration and metadata storage
  - Capability tracking and verification
  - Reputation scoring system
  - Access control for agent operations
  - **Enhanced**: Agent removal with proposal cleanup
  - **Enhanced**: Agent data updates via `setAgentData`

### Task Registry
- **Purpose**: Decentralized task lifecycle management
- **Key Features**:
  - Task creation and specification
  - Assignment mechanisms
  - Progress tracking and validation
  - Completion verification and rewards
  - **Enhanced**: ERC20 token payment support
  - **Enhanced**: Comprehensive payment handling

### Service Registry
- **Purpose**: Service discovery and matching
- **Key Features**:
  - Service listing and categorization
  - Capability-based matching
  - Quality scoring and feedback
  - Economic pricing mechanisms

### EnsembleCredits Token
- **Purpose**: Ecosystem-specific value transfer and rewards
- **Key Features**:
  - Non-transferable ERC20 implementation
  - 6 decimal precision for micro-transactions
  - Role-based minting system
  - Burning capabilities (self and minter-controlled)
  - Self-managing access control hierarchy
  - Custom errors for gas efficiency

## Technical Decisions

### Smart Contract Architecture
- **Solidity 0.8.20**: Latest stable version with overflow protection
- **OpenZeppelin**: Security-tested contract libraries
- **Upgradeable Patterns**: Future-proof contract evolution
- **Gas Optimization**: Efficient storage layouts and operations

### State Management
- **Struct Packing**: Optimized storage to reduce gas costs
- **Event Emissions**: Comprehensive logging for off-chain indexing
- **State Validation**: Robust checks for data integrity
- **Custom Errors**: Gas-efficient error handling

### Security Patterns
- **Access Control**: Role-based permissions using OpenZeppelin
- **Reentrancy Guards**: Protection against common attack vectors
- **Input Validation**: Comprehensive parameter checking
- **Emergency Controls**: Pause mechanisms for critical operations

### Token Economics
- **Non-transferable Design**: Prevents speculation and maintains utility focus
- **Hierarchical Roles**: Minters can manage other minters for scalability
- **Flexible Supply**: Constructor supports optional initial minting
- **Burning Mechanisms**: Both user-initiated and minter-controlled destruction

## Data Flow Patterns

### Registration Flow
1. Agent calls `registerAgent()` on AgentRegistry
2. Capabilities are validated and stored
3. Agent ID is generated and returned
4. Event is emitted for off-chain indexing

### Task Execution Flow
1. Task is created via `createTask()` on TaskRegistry
2. Payment (ETH or ERC20) is held in escrow
3. Eligible agents discover task through events
4. Agent assigns to task via `assignTask()`
5. Task execution is tracked and validated
6. Completion triggers payment release and potential credit rewards

### Service Discovery Flow
1. Services are registered in ServiceRegistry
2. Consumers query based on requirements
3. Matching algorithm returns compatible services
4. Selection and engagement occur through smart contracts

### Credit Flow (Planned)
1. Credits are minted to agents for task completion
2. Credits can be burned for service payments
3. Role-based minting allows ecosystem expansion
4. Non-transferable nature maintains utility focus

### Agent Lifecycle Management
1. Agent registration with identity and capabilities
2. Service offering and task participation
3. Reputation building through task completion
4. Data updates via `setAgentData` for profile management
5. Complete removal via `removeAgent` with cleanup

## Deployment Patterns
- **Hardhat Ignition**: Declarative deployment management
- **Multi-Network**: Consistent deployments across chains
- **Environment Configuration**: Network-specific parameters
- **Verification**: Automatic contract verification on deployment

## Recent Enhancements

### Agent Registry Improvements
- **Agent Removal**: Complete `removeAgent` functionality with proposal cleanup
- **Data Management**: `setAgentData` for updating agent information
- **Access Control**: Enhanced ownership validation and security

### Task Registry Enhancements
- **ERC20 Support**: Full integration of ERC20 token payments
- **Payment Escrow**: Secure holding and release of task payments
- **Comprehensive Testing**: Edge cases and error conditions covered

### Credit System Integration
- **Token Implementation**: Complete EnsembleCredits contract
- **Role Management**: Self-managing minter hierarchy
- **Gas Optimization**: Custom errors and efficient operations
- **Security**: Comprehensive validation and access controls 