# Changesets

This monorepo uses [changesets](https://github.com/changesets/changesets) for version management and publishing.

## Quick Start

```bash
# Create a changeset
pnpm changeset

# Check changeset status
pnpm changeset:status

# Version packages (usually done by CI)
pnpm changeset:version

# Publish packages (usually done by CI)  
pnpm changeset:publish
```

## Creating Changesets

When you make changes that should be released, create a changeset:

```bash
pnpm changeset
```

This will:
1. Ask which packages have changed
2. Ask what type of change (major/minor/patch) for each
3. Prompt you to write a summary

## Change Types

- **patch** (0.0.x): Bug fixes, small improvements, documentation updates
- **minor** (0.x.0): New features, new API methods (backwards compatible)  
- **major** (x.0.0): Breaking changes, API changes that break existing code

## Changeset Categories

Use these prefixes in your changeset summaries:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions/changes
- `chore:` Maintenance tasks
- `breaking:` Breaking changes (auto-triggers major version)

## Example Changeset

```markdown
---
"@ensemble-ai/sdk": minor
"@ensemble-ai/cli": patch
---

feat: Add subgraphUrl as required parameter to SDK configuration

- SDK: subgraphUrl is now required in EnsembleConfig
- CLI: Updated to always provide subgraphUrl from config
- This ensures agent query methods always work correctly
```

## Package Versioning

Each package versions independently:

- **@ensemble-ai/sdk**: Core SDK, follows semver strictly
- **@ensemble-ai/cli**: CLI tool, minor bumps for new commands
- **@ensemble-ai/contracts**: Smart contracts, major bumps for contract changes
- **@ensemble-ai/subgraph**: Subgraph indexer, syncs with contract versions
- **@ensemble-ai/mcp-server**: MCP server, independent versioning

## Release Process

### Automated (Recommended)
1. Create changeset with your PR
2. Merge PR to main
3. CI creates "Release packages" PR
4. Review and merge release PR
5. CI publishes to npm

### Manual
```bash
pnpm changeset:version  # Update versions and changelogs
pnpm changeset:publish  # Publish to npm
```

### Prerelease
```bash
# Enter prerelease mode
pnpm changeset pre enter alpha

# Create changesets normally
pnpm changeset

# Version and publish with tag
pnpm changeset:version
pnpm changeset:publish --tag alpha

# Exit prerelease mode
pnpm changeset pre exit
```

## Troubleshooting

### "No changesets present"
You forgot to create a changeset! Run `pnpm changeset`.

### Package not updating
Make sure the package is listed in your changeset markdown.

### Wrong version bump
Delete the changeset file and recreate it with the correct type.

### Internal dependency conflicts
Changesets will automatically update internal dependencies based on the `updateInternalDependencies` setting.