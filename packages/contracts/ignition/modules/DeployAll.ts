import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import EnsembleCreditsModule from "./EnsembleCredits";
import ServiceRegistryUpgradeableModule from "./ServiceRegistryUpgradeable";
import AgentsRegistryUpgradeableModule from "./AgentsRegistryUpgradeable";
import TaskRegistryUpgradeableModule from "./TaskRegistryUpgradeable";

/**
 * Master deployment module for the entire Ensemble Framework
 * 
 * This module orchestrates the deployment of all contracts in the correct order:
 * 1. EnsembleCredits (independent ERC20 token)
 * 2. ServiceRegistry (base registry)
 * 3. AgentsRegistry (depends on ServiceRegistry)
 * 4. TaskRegistry (depends on ServiceRegistry and can integrate with EnsembleCredits)
 * 
 * Parameters (all optional & overridable via CLI / ignition.json):
 *  - tokenName        (string)  : ERC20 name for credits (default: "Ensemble Credits")
 *  - tokenSymbol      (string)  : ERC20 symbol for credits (default: "EC")
 *  - initialAdmin     (address) : Admin for all contracts (default: deployer[0])
 *  - initialSupply    (uint256) : Initial credits supply (default: 0)
 *  - v1RegistryAddress (address): Legacy registry address (default: zero address)
 */
export default buildModule("DeployAllModule", (m) => {
  // Global parameters
  const initialAdmin = m.getParameter("initialAdmin", m.getAccount(0));
  
  // Deploy EnsembleCredits token (independent)
  const { ensembleCredits } = m.useModule(EnsembleCreditsModule);
  
  // Deploy ServiceRegistry (base dependency)
  const { serviceRegistry } = m.useModule(ServiceRegistryUpgradeableModule);
  
  // Deploy AgentsRegistry (depends on ServiceRegistry)
  const { agentsRegistry, agentsRegistryProxy, agentsRegistryImpl } = m.useModule(AgentsRegistryUpgradeableModule);
  
  // Deploy TaskRegistry (depends on ServiceRegistry)
  const { taskRegistry, taskRegistryProxy, taskRegistryImpl } = m.useModule(TaskRegistryUpgradeableModule);

  // Optional: Set up initial integrations between contracts
  // Note: These are commented out as they depend on your specific business logic
  
  // Example: Grant minter role to TaskRegistry for automatic reward distribution
  // m.call(ensembleCredits, "grantRole", [
  //   m.staticCall(ensembleCredits, "MINTER_ROLE"),
  //   taskRegistry
  // ], { id: "GrantMinterRoleToTaskRegistry" });

  return {
    // ERC20 Token
    ensembleCredits,
    
    // Registry Contracts (Proxy Instances)
    serviceRegistry,
    agentsRegistry,
    taskRegistry,
    
    // Proxy Addresses (for upgrades)
    agentsRegistryProxy,
    taskRegistryProxy,
    
    // Implementation Addresses (for verification)
    agentsRegistryImpl,
    taskRegistryImpl
  };
}); 