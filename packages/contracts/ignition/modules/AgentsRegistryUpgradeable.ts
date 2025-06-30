import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ServiceRegistryUpgradeableModule from "./ServiceRegistryUpgradeable";

const AgentsRegistryUpgradeableModule = buildModule("AgentsRegistryUpgradeableModule", (m) => {
    // Use the ServiceRegistryUpgradeable module
    const { serviceRegistry } = m.useModule(ServiceRegistryUpgradeableModule);

    // Deploy the AgentsRegistryUpgradeable implementation
    const agentsRegistryImpl = m.contract("AgentsRegistryUpgradeable", [], {
        id: "AgentsRegistryImpl"
    });

    // For initialization, we need the V1 registry address and service registry
    // Using a placeholder address for V1 registry (can be updated via parameters)
    const v1RegistryAddress = m.getParameter("v1RegistryAddress", "0x0000000000000000000000000000000000000000");

    // Encode the initialize function call with required parameters
    const initializeData = m.encodeFunctionCall(agentsRegistryImpl, "initialize", [
        v1RegistryAddress,
        serviceRegistry
    ]);

    // Deploy the UUPS proxy with the implementation and initialization data
    const agentsRegistryProxy = m.contract("ERC1967Proxy", [
        agentsRegistryImpl,
        initializeData,
    ], {
        id: "AgentsRegistryProxy"
    });

    // Create a contract instance that uses the proxy address but the implementation ABI
    const agentsRegistry = m.contractAt("AgentsRegistryUpgradeable", agentsRegistryProxy, {
        id: "AgentsRegistryProxied"
    });

    return { 
        agentsRegistry, 
        agentsRegistryProxy, 
        agentsRegistryImpl,
        serviceRegistry 
    };
});

export default AgentsRegistryUpgradeableModule; 