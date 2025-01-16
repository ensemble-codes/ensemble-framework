import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ServiceRegistry from "./ServiceRegistry";

const AgentsRegistryModule = buildModule("AgentsRegistryModule", (m) => {

    const { serviceRegistry} = m.useModule(ServiceRegistry);

    const agentsRegistry = m.contract("AgentsRegistry", [serviceRegistry]);

    return { agentsRegistry, serviceRegistry };
});

export default AgentsRegistryModule; 