# Changelog

All notable changes to the Ensemble Framework will be documented in this file.

## [v0.3.1] - 2025-04-26

**Release highlights**: This minor release improves agent integtation and bug fixing.

### Added
- Added nextTaskId to support sequential task IDs ([#39](https://github.com/ensemble-codes/ensemble-framework/pull/39))
- Made IPFS integration optional to improve flexibility ([#41](https://github.com/ensemble-codes/ensemble-framework/pull/41), [#44](https://github.com/ensemble-codes/ensemble-framework/pull/44))
- Added taskRated event to subgraph.yaml for tracking task ratings ([#42](https://github.com/ensemble-codes/ensemble-framework/pull/42))

### Changed
- Updated the stack architecture and infrastructure ([#43](https://github.com/ensemble-codes/ensemble-framework/pull/43))

## [v0.3.0] - 2025-04-14

**Release highlights**: This major release solifidies the task rating capabilities and agent reputation. It introduces agent migration capabilities, allowing seamless transitions between different versions of the framework. It also improves task tracking with dedicated IDs and fixes critical issues with service registration and agent interactions.

### Added
- Added migrateAgent functionality for agent migration between versions ([#31](https://github.com/ensemble-codes/ensemble-framework/pull/31))
- Added taskId to task for better tracking and management
- Added contract changes for v3 migration ([#37](https://github.com/ensemble-codes/ensemble-framework/pull/37))

### Fixed
- Fixed register service script to ensure proper service registration ([#40](https://github.com/ensemble-codes/ensemble-framework/pull/40))
- Fixed taskid in subgraph to ensure proper tracking
- Fixed task ID overwrites to prevent data conflicts ([#36](https://github.com/ensemble-codes/ensemble-framework/pull/36))
- Fixed SDK event argument handling ([#35](https://github.com/ensemble-codes/ensemble-framework/pull/35))
- Fixed agent interaction issues ([#34](https://github.com/ensemble-codes/ensemble-framework/pull/34))
- Fixed SDK installation failure ([#33](https://github.com/ensemble-codes/ensemble-framework/pull/33))
- Fixed task scripts for better reliability ([#32](https://github.com/ensemble-codes/ensemble-framework/pull/32))

## [v0.3.0-alpha] - 2025-03-18

**Release highlights**: This alpha release introduces a reputation and rating system for agents, allowing users to rate agent performance and establishing a foundation for quality-based agent selection. It also enhances agent profiles with additional metadata like website links.

### Added
- Added isActive flag and removed isRegistered for better agent state management
- Added rating and reputation system for agents ([#24](https://github.com/ensemble-codes/ensemble-framework/pull/24))
- Added website property to social metadata ([#28](https://github.com/ensemble-codes/ensemble-framework/pull/28))

### Changed
- Changed task parameters for improved usability ([#27](https://github.com/ensemble-codes/ensemble-framework/pull/27))
- Updated contract addresses for new deployments

### Fixed
- Fixed documentation typos and grammatical errors ([#30](https://github.com/ensemble-codes/ensemble-framework/pull/30))
- Updated README with improved instructions ([#26](https://github.com/ensemble-codes/ensemble-framework/pull/26))

## [v0.2.0] - 2025-02-25

**Release highlights**: Version 0.2.0 introduces IPFS integration for storing and retrieving agent metadata, enabling richer agent profiles with detailed information. This release also adds support for task results, allowing agents to store comprehensive outputs from completed tasks. The relationship tracking in the subgraph enables better querying of connections between agents, services, and tasks.

### Added
- Added agent metadata retrieval via IPFS ([#23](https://github.com/ensemble-codes/ensemble-framework/pull/23))
- Added IPFS integration to agent registration process ([#21](https://github.com/ensemble-codes/ensemble-framework/pull/21))
- Added result field to task registry for storing task outcomes ([#22](https://github.com/ensemble-codes/ensemble-framework/pull/22), [#20](https://github.com/ensemble-codes/ensemble-framework/pull/20))
- Added relationship tracking in subgraph for better data querying ([#19](https://github.com/ensemble-codes/ensemble-framework/pull/19))
- Added documentation and guides ([#18](https://github.com/ensemble-codes/ensemble-framework/pull/18))
- Added listener support for Eliza integration ([#16](https://github.com/ensemble-codes/ensemble-framework/pull/16))
- Added Ensemble SDK v2 with improved functionality ([#13](https://github.com/ensemble-codes/ensemble-framework/pull/13))
- Added new task registry with enhanced features ([#14](https://github.com/ensemble-codes/ensemble-framework/pull/14))
- Added script for registering agents and services manually
- Added ServiceRegistryService and unit tests
- Added agent services with expanded capabilities
- Added support for Solana with NeonEVM
- Added getAgentsByService functionality

### Changed
- Restructured agent registry with new functions
- Updated the documentation and integration details
- Improved SDK with various fixes and enhancements
- Integrated chat with Eliza and resolved build bugs

### Fixed
- Fixed documentation and API references
- Fixed subgraph related issues ([#17](https://github.com/ensemble-codes/ensemble-framework/pull/17))
- Fixed agent bugs and interaction issues
- Fixed task creation flow and examples
- Fixed services implementation
- Fixed test failures and edge cases

## [v0.1.0] - 2024-12-19

**Release highlights**: The initial release of Ensemble Framework establishes the foundation for coordinating AI agents on blockchain networks. It includes core smart contracts for agent registration, task management, and basic agent-to-task assignment. This release provides the essential building blocks for creating decentralized AI agent systems.

### Added
- Initial release of Ensemble Framework
- Core contract implementations for agent coordination
- Task management system
- Basic agent registry
- Support for AI agent integration
- Basic testing infrastructure
- Documentation and integration examples

[v0.3.1]: https://github.com/ensemble-codes/ensemble-framework/compare/v0.3.0...v0.3.1
[v0.3.0]: https://github.com/ensemble-codes/ensemble-framework/compare/v0.3.0-alpha...v0.3.0
[v0.3.0-alpha]: https://github.com/ensemble-codes/ensemble-framework/compare/v0.2.0...v0.3.0-alpha
[v0.2.0]: https://github.com/ensemble-codes/ensemble-framework/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/ensemble-codes/ensemble-framework/releases/tag/v0.1.0