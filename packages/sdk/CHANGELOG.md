# Changelog

All notable changes to the Ensemble SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-08-22

### BREAKING CHANGE
- **Communication type renamed**: `socketio-eliza` renamed to `eliza`
  - Update your agent registration to use `communicationType: 'eliza'` instead of `communicationType: 'socketio-eliza'`

### Added
- Export SDK validations

### Changed
- Rename socketio to eliza
- Update param names

## [0.5.6] - 2025-08-15

### BREAKING CHANGE
- **Agent registration API changed**: `registerAgent()` method signature changed
  - Update calls from `registerAgent(address, metadata)` to `registerAgent(address, params)`

### Added
- Zod validation schemas
- SDK agent record fixes
- Agent Record types fixes

### Changed
- Integrating zod for agent record
- SDK types cleaning
- Bumping version

## [0.5.5] - 2025-08-03

### Fixed
- Add missing files

## [0.5.4] - 2025-07-29

### Changed
- Bumping

## [0.5.0] - 2025-07-27

### BREAKING CHANGE
- **Configuration API changed**: Constructor signature changed for subgraph support

### Added
- Adding proposals script, script fixes, adding add proposal to the SDK
- SDK v5 version
- Subgraph integration

### Changed
- Agent registry SDK improvements

## [0.4.1] - 2025-07-17

### Changed
- Package.json bump

## [0.4.0] - 2025-07-04

### Added
- Add sdk and subgraph
- Bump to 0.4.0

## [0.3.6] - 2025-07-03

### Added
- Add sdk and subgraph

## [0.3.5] - 2025-06-29

### Changed
- Bumping sdk, upgrading readme

## [0.3.4] - 2025-04-22

### Changed
- Turning ipfsSdk to optional dependency

## [0.3.3] - 2025-04-07

### Fixed
- SDK bugfix: event args

## [0.3.1] - 2025-03-31

### Added
- Add migrateAgent
- Adding command to upload docs

### Fixed
- Hotfix: sdk install failure
- Bugfix: add fixes for agent interaction

## [0.3.0] - 2025-03-18

### BREAKING CHANGE
- **Contract events restructured**: Adding isActive, removing isRegistered, adding rating and reputation

### Added
- V3: adding isActive, removing isRegistered, adding rating and reputation
- Add website prop to social

### Changed
- Bump version to 0.3.0

### Fixed
- Fix task scripts

## [0.2.9] - 2025-03-13

### Added
- Add website prop to social

### Changed
- Bump version to 0.2.9

## [0.2.8] - 2025-03-12

### Fixed
- Task params fixes
- Update addresses

### Changed
- Bumping sdk

## [0.2.7] - 2025-03-12

### Changed
- Updating the SDK

## [0.2.6] - 2025-02-19

### Added
- Adding IPFS to the agent registration

### Fixed
- Fixing docs

## [0.2.5] - 2025-02-05

### Added
- Adding docs

## [0.2.4] - 2025-01-22

### Changed
- Releasing the sdk version
- Updating documentation

## [0.2.3] - 2025-01-17

### Added
- Finish listener for eliza

### Changed
- Bumping sdk version

## [0.2.2] - 2025-01-16

### Fixed
- Fixing create task example

## [0.2.1] - 2025-01-16

### Added
- Ensemble SDK v2
- Services registry
- Create task improvements

### Fixed
- Fixing TaskRegistry
- Fixing services and small fixes

## [0.1.5] - 2024-12-22

### Changed
- Bump

## [0.1.4] - 2024-12-21

### Changed
- Bump sdk

## [0.1.3] - 2024-12-21

### Added
- Testing with eliza
- Add addresses to the README

### Fixed
- SDK fixes, bumping to 0.1.3

## [0.1.2] - 2024-12-20

### Changed
- Bumping

## [0.1.1] - 2024-12-19

### Added
- Adding README
- Adding documentation and integration details

### Changed
- Change package name

## [0.1.0] - 2024-11-24

### Added
- Initial TypeScript SDK implementation
- Agent management (registration, skills, reputation)
- Task management (creation, assignment, execution)
- Event handling and error management
- Network validation
- Contract integration for proposals