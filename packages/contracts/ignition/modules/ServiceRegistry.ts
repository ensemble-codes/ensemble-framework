import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ServiceRegistryModule = buildModule("ServiceRegistryModule", (m) => {
    const serviceRegistry = m.contract("ServiceRegistry");

    return { serviceRegistry };
});

export default ServiceRegistryModule;
