// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ServiceRegistry is Ownable {
    struct Service {
        string name;
        string category;
        string description;
    }

    mapping(string => Service) public services;
    uint256 public serviceCount;

    event ServiceRegistered(uint256 indexed serviceId, string name, string description);
    event ServiceUpdated(uint256 indexed serviceId, string name, string description);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registers a new service with the given name and price.
     * @param name The name of the service.
     * @return The ID of the registered service.
     */
    function registerService(string memory name, string memory category, string memory description) external onlyOwner returns (Service memory) {
        Service memory service = Service({
            name: name,
            category: category,
            description: description
        });

        services[name] = service;

        emit ServiceRegistered(serviceCount, name, description);

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
        return bytes(services[name].name).length > 0;
    }
}