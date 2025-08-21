import { getCurrentNetwork, type NetworkType } from './config';

// Validate Stacks address format
export const validateStacksAddress = (address: string, network: NetworkType = getCurrentNetwork()): boolean => {
  if (network === 'mainnet') {
    return address.startsWith('SP');
  } else {
    return address.startsWith('ST');
  }
};

// Convert between sBTC and microsBTC
export const sbtcToMicrosBTC = (sbtcAmount: number): number => {
  return Math.floor(sbtcAmount * 100_000_000);
};

export const microsBTCToSBTC = (microsBTCAmount: number): number => {
  return microsBTCAmount / 100_000_000;
};

// Format sBTC amount for display
export const formatSBTCAmount = (microsBTCAmount: number, decimals: number = 8): string => {
  const sbtcAmount = microsBTCToSBTC(microsBTCAmount);
  return sbtcAmount.toFixed(decimals);
};