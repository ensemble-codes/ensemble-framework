import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentsRegistryModule = buildModule("AgentsRegistryModule", (m) => {

    const serviceRegistry = m.contract("ServiceRegistry");

    const agentsRegistry = m.contract("AgentsRegistry", [serviceRegistry]);

    return { agentsRegistry };
});

export default AgentsRegistryModule; 