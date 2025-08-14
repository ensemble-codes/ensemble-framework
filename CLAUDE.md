# Claude AI Assistant Guidelines

## Development Mode Commands

When suggesting Ensemble CLI commands, we are in **development mode** by default. This means:

### Instead of:
```bash
ensemble agents list
ensemble agents get 0x123...
ensemble wallets create my-wallet
```

### Use:
```bash
pnpm dev agents list
pnpm dev agents get 0x123...
pnpm dev wallets create my-wallet
```

### Explanation:
- The CLI is not globally installed via npm during development
- We run commands using `pnpm dev` which executes `tsx src/bin/ensemble.ts`
- This allows testing changes without building or linking

### Examples:
```bash
# List agents
pnpm dev agents list

# Get specific agent
pnpm dev agents get 0x5c02b4685492d36a40107b6ec48a91ab3f8875cb

# Update agent
pnpm dev agents update 0x5c02b4685492d36a40107b6ec48a91ab3f8875cb \
  --communication-type "socketio-eliza" \
  --communication-params '{"websocketUrl": "https://agents.ensemble.codes", "agentId": "28d29474-23c7-01b9-aee8-ba150c366103", "version": "1.x", "env": "production"}'

# Wallet operations
pnpm dev wallets create main-wallet
pnpm dev wallets list
pnpm dev wallets balance
```

### When to use `ensemble` directly:
Only after running `npm link` or when the package is installed globally via npm.