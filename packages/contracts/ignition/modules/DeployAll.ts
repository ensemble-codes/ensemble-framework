import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import EnsembleCreditsModule from "./EnsembleCredits";
import ServiceRegistryUpgradeableModule from "./ServiceRegistryUpgradeable";
import AgentsRegistryUpgradeableModule from "./AgentsRegistryUpgradeable";

/**
 * Master deployment module for the Ensemble Framework V2
 * 
 * This module orchestrates the deployment of all contracts in the correct order:
 * 1. EnsembleCredits (independent ERC20 token)
 * 2. ServiceRegistry (base registry for service management)
 * 3. AgentsRegistry (agent management with reputation system)
 * 
 * Note: TaskRegistry has been removed as it's now legacy.
 * Services and agents are managed independently through their respective registries.
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
  
  // Deploy AgentsRegistry (depends on ServiceRegistry for V1 migration only)
  const { agentsRegistry, agentsRegistryProxy, agentsRegistryImpl } = m.useModule(AgentsRegistryUpgradeableModule);

  // Optional: Set up initial integrations between contracts
  // Note: These are commented out as they depend on your specific business logic

  return {
    // ERC20 Token
    ensembleCredits,
    
    // Registry Contracts (Proxy Instances)
    serviceRegistry,
    agentsRegistry,
    
    // Proxy Addresses (for upgrades)
    agentsRegistryProxy,
    
    // Implementation Addresses (for verification)
    agentsRegistryImpl
  };
});