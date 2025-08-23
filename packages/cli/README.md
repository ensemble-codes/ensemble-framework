# Ensemble CLI

A powerful command-line interface for managing Ensemble agents, wallets, and blockchain interactions.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Commands](#commands)
  - [Agent Commands](#agent-commands)
  - [Wallet Commands](#wallet-commands)
  - [Configuration Commands](#configuration-commands)
- [Global Options](#global-options)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or pnpm package manager

### Install from npm

```bash
npm install -g @ensemble-ai/cli
```

### Install from Source

```bash
git clone https://github.com/ensemble-codes/ensemble-framework
cd ensemble-framework
pnpm install        # Install all workspace dependencies
pnpm -r build       # Build all packages in correct order
cd packages/cli
npm link            # Optional: Make 'ensemble' command available globally otherwise run commands with pnpm dev
```

## Getting Started

### Quick Start

1. **Create a wallet** (required for signing transactions):
   ```bash
   ensemble wallet create my-wallet
   ```

2. **Set it as your active wallet**:
   ```bash
   ensemble wallet use my-wallet
   ```

3. **List available agents**:
   ```bash
   ensemble agents list
   ```

4. **Get details for a specific agent**:
   ```bash
   ensemble agent 0x18539799494fd1e91a11c6bf11d9260cb50cb08a
   ```

## Configuration

The CLI stores configuration in `~/.ensemble/config.json`. Default configuration includes:

- **Network**: Base Sepolia testnet
- **RPC URL**: Alchemy endpoint for Base Sepolia
- **Output Format**: YAML (can be changed to json, csv, or table)
- **Contracts**: Pre-configured addresses for agent, task, and service registries

View your current configuration:
```bash
ensemble config
```

## Commands

### Agent Commands

#### `ensemble agent <address>`
Get detailed information about a specific agent by its address.

```bash
ensemble agent 0x18539799494fd1e91a11c6bf11d9260cb50cb08a
```

**Output includes:**
- Agent name and description
- Owner address
- Category and attributes
- Instructions and prompts
- Social links
- Communication details
- Reputation score

#### `ensemble agents list`
List all agents with pagination and filtering options.

**Options:**
- `--first <number>` - Number of agents to fetch (default: 10)
- `--skip <number>` - Number of agents to skip for pagination (default: 0)
- `--owner <address>` - Filter agents by specific owner address
- `--mine` - Filter agents owned by your connected wallet

**Examples:**
```bash
# List first 10 agents
ensemble agents list

# List agents owned by a specific address
ensemble agents list --owner 0x4f4D718643A2b07BDAC5d84d41d5737BBD8CCAa4

# List your own agents
ensemble agents list --mine

# Pagination: skip first 10, get next 5
ensemble agents list --skip 10 --first 5
```

### Wallet Commands

The CLI includes a secure wallet management system for signing transactions and managing multiple wallets.

#### `ensemble wallet create [name]`
Create a new wallet with mnemonic backup or private key.

**Options:**
- `--type <type>` - Wallet type: 'mnemonic' or 'private-key' (default: mnemonic)

**Example:**
```bash
# Create wallet with mnemonic (recommended)
ensemble wallet create my-wallet

# Create wallet with private key
ensemble wallet create trading-wallet --type private-key
```

**Security Notes:**
- Passwords must be at least 8 characters
- Mnemonic phrase is shown only once - save it securely!
- Wallets are encrypted and stored in `~/.ensemble/wallets/`

#### `ensemble wallet import [name]`
Import an existing wallet from mnemonic, private key, or keystore file.

**Options:**
- `--mnemonic` - Import from mnemonic phrase
- `--private-key` - Import from private key
- `--keystore <file>` - Import from keystore file (not yet implemented)

**Examples:**
```bash
# Interactive import (prompts for method)
ensemble wallet import old-wallet

# Import from mnemonic
ensemble wallet import old-wallet --mnemonic

# Import from private key
ensemble wallet import trading-wallet --private-key
```

#### `ensemble wallet list`
List all available wallets with their addresses and status.

```bash
ensemble wallet list
```

**Output shows:**
- Wallet names with active indicator
- Ethereum addresses
- Encryption status
- Creation date
- Wallet type (mnemonic/private-key)

#### `ensemble wallet use <name>`
Set a wallet as the active wallet for CLI operations.

```bash
ensemble wallet use my-wallet
```

**Note:** Once set, the active wallet is used by default for all operations requiring a wallet.

#### `ensemble wallet current`
Display the currently active wallet.

```bash
ensemble wallet current
```

#### `ensemble wallet balance [wallet]`
Check ETH balance for a wallet. Uses active wallet if none specified.

**Examples:**
```bash
# Check active wallet balance
ensemble wallet balance

# Check specific wallet balance
ensemble wallet balance my-wallet

# Check balance using global wallet override
ensemble --wallet trading-wallet wallet balance
```

#### `ensemble wallet export <name>`
Export wallet data in various formats.

**Options:**
- `--format <format>` - Export format: 'mnemonic', 'private-key', or 'keystore' (default: mnemonic)

**Examples:**
```bash
# Export mnemonic (if wallet was created with mnemonic)
ensemble wallet export my-wallet

# Export private key
ensemble wallet export my-wallet --format private-key

# Export as keystore file
ensemble wallet export my-wallet --format keystore
```

**⚠️ Security Warning:** Exported data is sensitive! Handle with extreme care.

#### `ensemble wallet delete <name>`
Delete a wallet after confirmation and password verification.

```bash
ensemble wallet delete old-wallet
```

**Notes:**
- Requires password confirmation
- If deleting the active wallet, it will be cleared
- Make sure you have backups before deleting!

### Configuration Commands

#### `ensemble config`
Display current CLI configuration.

```bash
ensemble config
```

**Shows:**
- Network settings (mainnet/sepolia/baseSepolia)
- RPC URL
- Default output format
- Contract addresses
- Subgraph URL

## Global Options

These options can be used with any command:

### `--verbose`
Enable verbose output for debugging.

```bash
ensemble --verbose agents list
```

### `--format <format>`
Override the default output format for the current command.

**Available formats:**
- `yaml` - Human-readable YAML (default)
- `json` - JSON format for programmatic use
- `csv` - CSV format for spreadsheets
- `table` - Formatted table (not available for all commands)

**Examples:**
```bash
ensemble --format json agents list
ensemble --format csv wallet list
```

### `--wallet <name>`
Override the active wallet for the current command.

```bash
# Use different wallet for one command
ensemble --wallet trading-wallet agents list --mine

# Check balance of non-active wallet
ensemble --wallet old-wallet wallet balance
```

## Examples

### Complete Workflow Example

```bash
# 1. Create and set up a wallet
ensemble wallet create main-wallet
ensemble wallet use main-wallet

# 2. Check your wallet balance
ensemble wallet balance

# 3. List all available agents
ensemble agents list

# 4. List only your agents
ensemble agents list --mine

# 5. Get details about a specific agent
ensemble agent 0x18539799494fd1e91a11c6bf11d9260cb50cb08a

# 6. Export data in JSON format for processing
ensemble --format json agents list > agents.json

# 7. Use a different wallet temporarily
ensemble --wallet test-wallet agents list --mine
```

### Managing Multiple Wallets

```bash
# Create multiple wallets for different purposes
ensemble wallet create personal
ensemble wallet create trading
ensemble wallet create testing

# List all wallets
ensemble wallet list

# Switch between wallets
ensemble wallet use trading
ensemble wallet current

# Check balances
ensemble wallet balance personal
ensemble wallet balance trading
```

## Troubleshooting

### Common Issues

**"No wallet specified and no active wallet set"**
- Solution: Create a wallet with `ensemble wallet create` and set it active with `ensemble wallet use`

**"Invalid owner address format"**
- Solution: Ensure Ethereum addresses start with '0x' and are 42 characters long

**"Wallet not found"**
- Solution: Check available wallets with `ensemble wallet list`

**Network Connection Issues**
- Check your internet connection
- Verify RPC URL in configuration
- Use `--verbose` flag for detailed error messages

### Environment Variables

You can override configuration with environment variables:

- `ENSEMBLE_NETWORK` - Override network (mainnet/sepolia/baseSepolia)
- `ENSEMBLE_RPC_URL` - Override RPC endpoint
- `ENSEMBLE_OUTPUT_FORMAT` - Override default output format
- `ENSEMBLE_ACTIVE_WALLET` - Override active wallet
- `ENSEMBLE_WALLET_<name>` - Override specific wallet for commands

### Debug Mode

Run commands with `--verbose` to see detailed logs:

```bash
ensemble --verbose agents list
```

## Security Best Practices

1. **Never share your mnemonic phrases or private keys**
2. **Use strong passwords** for wallet encryption
3. **Keep backups** of your mnemonics in secure locations
4. **Don't commit** wallet files or credentials to version control
5. **Use hardware wallets** for high-value operations (not yet supported)

## Support

For issues, feature requests, or questions:
- GitHub Issues: [ensemble-framework/issues](https://github.com/ensemble-codes/ensemble-framework/issues)
- Documentation: [docs.ensemble.ai](https://docs.ensemble.ai)

## License

MIT License - see LICENSE file for details