import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import AgentsRegistryUpgradeableModule from "./AgentsRegistryUpgradeable";

const TaskRegistryUpgradeableModule = buildModule("TaskRegistryUpgradeableModule", (m) => {
    // Use the AgentsRegistryUpgradeable module (which includes ServiceRegistry)
    const { agentsRegistry, serviceRegistry } = m.useModule(AgentsRegistryUpgradeableModule);

    // Deploy the TaskRegistryUpgradeable implementation
    const taskRegistryImpl = m.contract("TaskRegistryUpgradeable", [], {
        id: "TaskRegistryImpl"
    });

    // Get initialization parameters
    const initialTaskId = m.getParameter("initialTaskId", 1);

    // Encode the initialize function call with required parameters
    const initializeData = m.encodeFunctionCall(taskRegistryImpl, "initialize", [
        initialTaskId,
        agentsRegistry
    ]);

    // Deploy the UUPS proxy with the implementation and initialization data
    const taskRegistryProxy = m.contract("ERC1967Proxy", [
        taskRegistryImpl,
        initializeData,
    ], {
        id: "TaskRegistryProxy"
    });

    // Create a contract instance that uses the proxy address but the implementation ABI
    const taskRegistry = m.contractAt("TaskRegistryUpgradeable", taskRegistryProxy, {
        id: "TaskRegistryProxied"
    });

    return { 
        taskRegistry, 
        taskRegistryProxy, 
        taskRegistryImpl,
        agentsRegistry,
        serviceRegistry 
    };
});

export default TaskRegistryUpgradeableModule; 