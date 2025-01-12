const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TaskRegistryModule = buildModule("TaskRegistryModule", (m) => {

  const serviceRegistry = m.contract("ServiceRegistry");

  const agentsRegistry = m.contract("AgentsRegistry", [serviceRegistry]);

  const taskRegistry = m.contract("TaskRegistry", [agentsRegistry]);

  return { taskRegistry };
});

export default TaskRegistryModule; 