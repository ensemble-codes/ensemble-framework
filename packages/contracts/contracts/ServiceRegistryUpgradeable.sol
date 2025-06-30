// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ServiceRegistryUpgradeable
 * @author leonprou
 * @notice A smart contract that stores information about the services provided by agents.
 * @dev Upgradeable version using UUPS proxy pattern
 */
contract ServiceRegistryUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct Service {
        string name;
        string category;
        string description;
    }

    mapping(string => Service) public services;
    uint256 public serviceCount;

    event ServiceRegistered(string name, string category, string description);
    event ServiceUpdated(string name, string category, string description);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     */
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        serviceCount = 0;
    }

    /**
     * @dev Registers a new service with the given name and price.
     * @param name The name of the service.
     * @return The ID of the registered service.
     */
    function registerService(string memory name, string memory category, string memory description) external returns (Service memory) {
        require(!this.isServiceRegistered(name), "Service already registered");

        Service memory service = Service({
            name: name,
            category: category,
            description: description
        });

        services[name] = service;

        emit ServiceRegistered(name, category, description);

        serviceCount++;
        return service;
    }

    /**
     * @dev Retrieves the details of a service.
     * @param name The name of the service to retrieve.
     * @return The details of the service.
     */
    function getService(string memory name) external view returns (Service memory) {
        return services[name];
    }

    function isServiceRegistered(string memory name) external view returns (bool) {
        require(bytes(name).length > 0, "Invalid service name");

        return bytes(services[name].name).length > 0;
    }

    function updateService(string memory name, string memory category, string memory description) external onlyOwner {
        require(this.isServiceRegistered(name), "Service not registered");

        services[name] = Service({
            name: name,
            category: category,
            description: description
        });

        emit ServiceUpdated(name, category, description);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[50] private __gap;
} 