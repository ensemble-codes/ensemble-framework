import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition deployment module for EnsembleCredits token.
 *
 * Parameters (all optional & overridable via CLI / ignition.json):
 *  - tokenName     (string)  : ERC20 name (default: "Ensemble Credits")
 *  - tokenSymbol   (string)  : ERC20 symbol (default: "EC")
 *  - initialAdmin  (address) : Admin & initial minter (default: deployer[0])
 *  - initialSupply (uint256) : Initial supply (default: 0)
 */
export default buildModule("EnsembleCreditsModule", (m) => {
  // Parameters with sensible defaults – can be overridden at deploy-time
  const tokenName = m.getParameter<string>("tokenName", "Ensemble Credits");
  const tokenSymbol = m.getParameter<string>("tokenSymbol", "EC");
  const initialAdmin = m.getParameter("initialAdmin", m.getAccount(0));
  const initialSupply = m.getParameter<number>("initialSupply", 0);

  // Deploy contract
  const ensembleCredits = m.contract("EnsembleCredits", [
    tokenName,
    tokenSymbol,
    initialAdmin,
    initialSupply,
  ]);

  // Optional: simple post-deploy call to assert deployer is minter (gas-less when simulated)
  m.call(ensembleCredits, "isMinter", [initialAdmin]);

  return { ensembleCredits };
}); 