import { getActiveWallet } from '../config/manager';

/**
 * Get the effective wallet to use for operations.
 * Priority: global --wallet option > active wallet > undefined
 */
export async function getEffectiveWallet(globalWalletOption?: string): Promise<string | undefined> {
  if (globalWalletOption) {
    return globalWalletOption;
  }
  
  return await getActiveWallet();
}

/**
 * Get the effective wallet or throw an error with helpful message
 */
export async function getEffectiveWalletOrThrow(globalWalletOption?: string): Promise<string> {
  const wallet = await getEffectiveWallet(globalWalletOption);
  
  if (!wallet) {
    throw new Error('No wallet specified and no active wallet set. Use --wallet <name> or set an active wallet with "ensemble wallet use <name>"');
  }
  
  return wallet;
}