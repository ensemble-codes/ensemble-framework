const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
import AgentsRegistry from "./AgentsRegistry";
import { servicesList } from '../../../sdk/scripts/data/servicesList';
import { ServiceRegistry } from '../../typechain-types/contracts/ServiceRegistry';

const TaskRegistryModule = buildModule("TaskRegistryModule", (m: any) => {


  const { serviceRegistry, agentsRegistry } = m.useModule(AgentsRegistry);

  const taskRegistry = m.contract("TaskRegistry", [1000, agentsRegistry]);

  return { taskRegistry, serviceRegistry, agentsRegistry };
});

export default TaskRegistryModule; 