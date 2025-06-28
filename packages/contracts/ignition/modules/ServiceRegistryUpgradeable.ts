import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ServiceRegistryUpgradeableModule = buildModule("ServiceRegistryUpgradeableModule", (m) => {
    // Get the proxy admin owner (first account)
    const proxyAdminOwner = m.getAccount(0);

    // Deploy the ServiceRegistryUpgradeable implementation
    const serviceRegistryImpl = m.contract("ServiceRegistryUpgradeable", [], {
        id: "ServiceRegistryImpl"
    });

    // Encode the initialize function call (no parameters needed)
    const initializeData = m.encodeFunctionCall(serviceRegistryImpl, "initialize", []);

    // Deploy the UUPS proxy with the implementation and initialization data
    const serviceRegistryProxy = m.contract("ERC1967Proxy", [
        serviceRegistryImpl,
        initializeData,
    ], {
        id: "ServiceRegistryProxy"
    });

    // Create a contract instance that uses the proxy address but the implementation ABI
    const serviceRegistry = m.contractAt("ServiceRegistryUpgradeable", serviceRegistryProxy, {
        id: "ServiceRegistryProxied"
    });

    return { 
        serviceRegistry, 
        serviceRegistryProxy, 
        serviceRegistryImpl 
    };
});

export default ServiceRegistryUpgradeableModule; 