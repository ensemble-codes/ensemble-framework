# Contributing to Ensemble Framework

Thank you for your interest in contributing to the Ensemble Framework! This guide will help you get started with our development process.

## Table of Contents

- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Release Process](#release-process)
- [Package Structure](#package-structure)
- [Guidelines](#guidelines)

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ensemble-codes/ensemble-framework.git
cd ensemble-framework

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Package Scripts

```bash
# Build all packages
pnpm build

# Build specific packages
pnpm build:sdk
pnpm build:cli
pnpm build:contracts

# Run tests
pnpm test
pnpm test:sdk
pnpm test:cli

# Type checking
pnpm typecheck
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

Make your changes in the appropriate package directories:

- `packages/sdk/` - TypeScript SDK
- `packages/cli/` - Command-line interface
- `packages/contracts/` - Smart contracts
- `packages/subgraph/` - The Graph subgraph
- `packages/mcp-server/` - MCP server

### 3. Add Tests

Please add tests for your changes:

```bash
# Run tests during development
pnpm test:sdk
pnpm test:cli

# Run type checking
pnpm typecheck
```

### 4. Create a Changeset

**This step is crucial!** Create a changeset to describe your changes:

```bash
pnpm changeset
```

This will:
1. Ask which packages have changed
2. Ask what type of change (major/minor/patch)
3. Prompt you to describe the change

#### Changeset Guidelines

- **patch**: Bug fixes, small improvements, documentation updates
- **minor**: New features, new API methods (backwards compatible)
- **major**: Breaking changes, API changes that break existing code

Example changeset:
```markdown
---
"@ensemble-ai/sdk": minor
"@ensemble-ai/cli": patch
---

feat: Add new agent filtering capabilities

- SDK: Added `searchAgents()` method for text-based search
- SDK: Added `reputation_min` and `reputation_max` filters
- CLI: Updated `agents list` command to support new filters
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add new agent filtering capabilities"
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

- Open a PR against the `main` branch
- Include a clear description of changes
- Link any related issues
- Ensure CI passes

## Release Process

We use [Changesets](https://github.com/changesets/changesets) for version management and releases.

### Automated Releases (Recommended)

1. **Merge PR to main**: When your PR with a changeset is merged
2. **Version PR created**: GitHub Actions creates a "Release packages" PR
3. **Review & merge**: Review the version bumps and changelog, then merge
4. **Automatic publish**: Packages are automatically published to npm

### Manual Release (Advanced)

```bash
# Version packages locally
pnpm changeset:version

# Review changes
git diff

# Commit version changes
git add .
git commit -m "chore: version packages"

# Publish to npm
pnpm changeset:publish

# Push with tags
git push --follow-tags
```

### Prerelease Process

For alpha/beta releases:

```bash
# Enter prerelease mode
pnpm changeset pre enter beta

# Create changesets as normal
pnpm changeset

# Version and publish
pnpm changeset:version
pnpm changeset:publish --tag beta

# Exit prerelease mode when done
pnpm changeset pre exit
```

## Package Structure

```
ensemble-framework/
├── packages/
│   ├── sdk/              # @ensemble-ai/sdk
│   ├── cli/              # @ensemble-ai/cli
│   ├── contracts/        # @ensemble-ai/contracts
│   ├── subgraph/         # @ensemble-ai/subgraph
│   ├── mcp-server/       # @ensemble-ai/mcp-server
│   └── python-sdk/       # Python SDK (separate versioning)
├── .changeset/           # Changesets configuration
├── .github/workflows/    # CI/CD workflows
└── docs/                 # Documentation
```

### Package Dependencies

- **CLI** depends on **SDK** (`workspace:^`)
- **Contracts** are independent
- **Subgraph** indexes **Contracts** events
- **MCP Server** queries **Subgraph**

## Guidelines

### Code Style

- Use TypeScript for all JavaScript/TypeScript code
- Follow existing code formatting (we use Prettier)
- Include JSDoc comments for public APIs
- Use descriptive variable and function names

### Testing

- Write unit tests for new functionality
- Update integration tests when changing APIs
- Ensure all tests pass before submitting PR
- Aim for good test coverage

### Documentation

- Update README files for significant changes
- Add JSDoc comments to public APIs
- Update examples when changing interfaces
- Include migration guides for breaking changes

### Breaking Changes

For breaking changes:
1. Mark changeset as `major`
2. Document the breaking change clearly
3. Provide migration guide
4. Consider deprecation period if possible

### Commit Messages

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

### Package-Specific Guidelines

#### SDK (@ensemble-ai/sdk)
- Follow semantic versioning strictly
- Maintain backward compatibility when possible
- Include comprehensive TypeScript types
- Add integration tests for public APIs

#### CLI (@ensemble-ai/cli)
- Maintain command backward compatibility
- Add help text for new commands
- Test commands manually before release
- Update CLI documentation

#### Contracts (@ensemble-ai/contracts)
- Test thoroughly on testnets before mainnet
- Document contract upgrades clearly
- Include deployment addresses in releases
- Follow Solidity best practices

#### Subgraph (@ensemble-ai/subgraph)
- Version in sync with contract changes
- Test queries thoroughly
- Document schema changes
- Include deployment URLs

## Getting Help

- **Discord**: Join our Discord server for real-time help
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions in GitHub Discussions

## Code of Conduct

Please be respectful and constructive in all interactions. We're building something great together!

---

Thank you for contributing to Ensemble Framework! 🚀