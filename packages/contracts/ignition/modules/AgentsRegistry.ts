import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ServiceRegistry from "./ServiceRegistry";

const AgentsRegistryModule = buildModule("AgentsRegistryModule", (m) => {

    const { serviceRegistry} = m.useModule(ServiceRegistry);

    const agentsRegistry = m.contract("AgentsRegistry", [
        '0xd5aD1B6c462C7cCF641Df8cdac356bc4a7C20400', 
        serviceRegistry
    ]);

    return { agentsRegistry, serviceRegistry };
});

export default AgentsRegistryModule; 