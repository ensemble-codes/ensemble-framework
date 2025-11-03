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

## Project Structure & Task Management

This is a **monorepo project** with multiple packages. Task management is centralized at the project root using task-master.

### Monorepo Structure:
```
ensemble-framework/          # Project root (task-master location)
├── packages/
│   ├── sdk/                # SDK package
│   ├── cli/                # CLI package
│   ├── contracts/          # Smart contracts
│   ├── app/                # Frontend application
│   ├── subgraph/           # Subgraph indexer
│   └── mcp-server/         # MCP server
└── .taskmaster/            # Centralized task management
```

### Task Management Rules:

#### **IMPORTANT**: Centralized Task Management
- **All task-master operations should be run from the project root directory**
- Task-master is initialized at: `/Users/leon/workspace/ensemble/ensemble-framework/`
- When creating or managing tasks, always `cd` to the project root first
- Tasks apply to the entire monorepo, not individual packages
- **Never initialize task-master in package subdirectories**

#### Correct Task Management Usage:
```bash
# Always navigate to project root first
cd /Users/leon/workspace/ensemble/ensemble-framework
task-master add-task --prompt="..."
task-master list
task-master show <id>
task-master set-status --id=<id> --status=<status>
```

#### Package-Specific Tasks:
When working on package-specific tasks:
1. Create the task at the project root level
2. Include the package name prefix in the task description
3. Navigate to the specific package directory for implementation

#### Package Naming Convention:
Use these prefixes when creating tasks to identify which package they belong to:
- `CLI:` - CLI package tasks
- `SDK:` - SDK package tasks  
- `Contracts:` - Smart contracts tasks
- `Subgraph:` - Subgraph tasks
- `MCP:` - MCP server tasks
- `Core:` - Cross-package/monorepo infrastructure tasks

#### Examples:
```bash
# Navigate to root and create a CLI testing task
cd /Users/leon/workspace/ensemble/ensemble-framework
task-master add-task --prompt="CLI: Implement comprehensive testing suite with Jest, including unit tests for commands and utilities"

# Create an SDK task
task-master add-task --prompt="SDK: Add Zod validation schemas for all agent types"

# Create a cross-package task
task-master add-task --prompt="Core: Update all packages to use latest TypeScript version"
```

#### Viewing Tasks by Package:
```bash
# View all tasks
task-master list

# Filter tasks by package (using grep)
task-master list | grep "CLI:"
task-master list | grep "SDK:"
task-master list | grep "Contracts:"
```

### Working in Package Directories:
When implementing tasks in a specific package:
```bash
# 1. Check tasks at root level
cd /Users/leon/workspace/ensemble/ensemble-framework
task-master next  # See next task to work on

# 2. Navigate to package for implementation
cd packages/cli
# ... do your work ...

# 3. Update task status from root
cd ../..
task-master set-status --id=<task-id> --status=done
```

### Task Organization Best Practices:
1. **Use descriptive task names** with package prefixes
2. **Group related tasks** using subtasks
3. **Set dependencies** between tasks when order matters
4. **Update task status** immediately when starting/completing work
5. **Add context** to tasks using the update command when you learn new information

### Common Task Management Commands:
```bash
# From project root only:
task-master list --status=pending      # View pending tasks
task-master next                       # Get next task to work on
task-master show <id>                  # View task details
task-master expand --id=<id>           # Break task into subtasks
task-master add-subtask --parent=<id> --title="..." --description="..."
task-master set-status --id=<id> --status=in-progress
task-master set-status --id=<id> --status=done
```

### Never Do This:
```bash
# ❌ WRONG - Don't initialize task-master in packages
cd packages/sdk
task-master init  # DON'T DO THIS

# ❌ WRONG - Don't create tasks from package directories  
cd packages/cli
task-master add-task  # DON'T DO THIS
```

### Always Do This:
```bash
# ✅ CORRECT - Always work from project root for tasks
cd /Users/leon/workspace/ensemble/ensemble-framework
task-master add-task --prompt="CLI: Add new command for..."
```

## Project Documentation

### PRD File Location
The Project Requirements Document (PRD) is located at: `.taskmaster/docs/prd.txt`

When updating project specifications, features, or requirements, update the PRD file to maintain alignment between implementation and documentation.