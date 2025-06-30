import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Module for upgrading registry contracts
 * This demonstrates how to upgrade UUPS proxies using Hardhat Ignition
 * 
 * Usage:
 * 1. Deploy new implementation contracts
 * 2. Call upgradeToAndCall on the existing proxies (OpenZeppelin v5 uses upgradeToAndCall instead of upgradeTo)
 * 
 * Note: This assumes you have existing proxy addresses from previous deployments
 */
const UpgradeRegistriesModule = buildModule("UpgradeRegistriesModule", (m) => {
    // Get existing proxy addresses (should be provided as parameters)
    const serviceRegistryProxyAddress = m.getParameter("serviceRegistryProxy");
    const agentsRegistryProxyAddress = m.getParameter("agentsRegistryProxy");
    const taskRegistryProxyAddress = m.getParameter("taskRegistryProxy");

    // Deploy new implementation contracts
    const newServiceRegistryImpl = m.contract("ServiceRegistryUpgradeable", [], {
        id: "NewServiceRegistryImpl"
    });
    
    const newAgentsRegistryImpl = m.contract("AgentsRegistryUpgradeable", [], {
        id: "NewAgentsRegistryImpl"
    });
    
    const newTaskRegistryImpl = m.contract("TaskRegistryUpgradeable", [], {
        id: "NewTaskRegistryImpl"
    });

    // Get contract instances for existing proxies
    const serviceRegistryProxy = m.contractAt("ServiceRegistryUpgradeable", serviceRegistryProxyAddress, {
        id: "ExistingServiceRegistryProxy"
    });
    
    const agentsRegistryProxy = m.contractAt("AgentsRegistryUpgradeable", agentsRegistryProxyAddress, {
        id: "ExistingAgentsRegistryProxy"
    });
    
    const taskRegistryProxy = m.contractAt("TaskRegistryUpgradeable", taskRegistryProxyAddress, {
        id: "ExistingTaskRegistryProxy"
    });

    // Perform upgrades by calling upgradeToAndCall on each proxy with empty data
    // Note: Only the proxy owner can perform these upgrades
    // In OpenZeppelin v5, upgradeTo was removed and upgradeToAndCall is used with empty data for simple upgrades
    m.call(serviceRegistryProxy, "upgradeToAndCall", [newServiceRegistryImpl, "0x"], {
        id: "UpgradeServiceRegistry"
    });
    
    m.call(agentsRegistryProxy, "upgradeToAndCall", [newAgentsRegistryImpl, "0x"], {
        id: "UpgradeAgentsRegistry"
    });
    
    m.call(taskRegistryProxy, "upgradeToAndCall", [newTaskRegistryImpl, "0x"], {
        id: "UpgradeTaskRegistry"
    });

    return {
        newServiceRegistryImpl,
        newAgentsRegistryImpl,
        newTaskRegistryImpl,
        serviceRegistryProxy,
        agentsRegistryProxy,
        taskRegistryProxy
    };
});

export default UpgradeRegistriesModule; 