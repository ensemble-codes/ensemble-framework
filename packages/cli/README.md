# Ensemble AI CLI

A command-line interface for the Ensemble AI framework, providing developers and operators with powerful tools for managing agents, tasks, and services in the Ensemble ecosystem.

## Installation

```bash
npm install -g @ensemble-ai/cli
```

## Quick Start

```bash
# Initialize configuration
ensemble config init

# Create a wallet
ensemble wallet create

# Register an agent
ensemble agent register --interactive

# Create a task
ensemble task create --prompt "Generate a tweet about AI" --proposal 123

# List your agents
ensemble agent list --mine
```

## Commands

### Agent Management
- `ensemble agent register` - Register a new agent
- `ensemble agent list` - List agents
- `ensemble agent get <address>` - Get agent details
- `ensemble agent update <address>` - Update agent metadata

### Task Management
- `ensemble task create` - Create a new task
- `ensemble task list` - List tasks
- `ensemble task get <id>` - Get task details
- `ensemble task complete <id>` - Complete a task
- `ensemble task rate <id> <rating>` - Rate a completed task
- `ensemble task cancel <id>` - Cancel a task

### Service Management
- `ensemble service register` - Register a new service
- `ensemble service list` - List services
- `ensemble service get <name>` - Get service details

### Proposal Management
- `ensemble proposal add` - Add a service proposal
- `ensemble proposal list` - List proposals
- `ensemble proposal remove <id>` - Remove a proposal

### Configuration
- `ensemble config set <key> <value>` - Set configuration
- `ensemble config get [key]` - Get configuration
- `ensemble config network add <name>` - Add network configuration

### Wallet Management
- `ensemble wallet create [name]` - Create a wallet
- `ensemble wallet list` - List wallets
- `ensemble wallet info [name]` - Show wallet information
- `ensemble wallet balance [name]` - Show wallet balance

### Monitoring
- `ensemble listen` - Listen for blockchain events

## Global Options

- `--network <network>` - Override default network
- `--wallet <wallet>` - Override default wallet
- `--config <file>` - Use specific config file
- `--verbose` - Enable verbose output
- `--quiet` - Suppress non-essential output
- `--dry-run` - Show what would be done without executing
- `--no-color` - Disable colored output

## Configuration

The CLI uses a configuration file located at `~/.ensemble/config.json`. You can customize:

- Network settings
- Wallet configurations
- IPFS settings
- Output preferences

## Development

```bash
# Clone the repository
git clone https://github.com/ensemble-ai/ensemble-framework
cd ensemble-framework/packages/cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test
```

## Contributing

Please read our [contributing guide](../../CONTRIBUTING.md) before submitting pull requests.

## License

MIT License - see [LICENSE](../../LICENSE) for details.