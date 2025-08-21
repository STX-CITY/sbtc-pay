import { 
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_MOCKNET
} from '@stacks/network';

export type NetworkType = 'mainnet' | 'testnet' | 'mocknet';

// sBTC Contract Details - Updated with 2024 addresses
export const SBTC_CONTRACT = {
  mainnet: {
    address: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR', // Actual mainnet address
    name: 'sbtc-token'
  },
  testnet: {
    address: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT',
    name: 'sbtc-token'
  },
  mocknet: {
    address: 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT', 
    name: 'sbtc-token'
  }
};

export const getNetwork = (networkType: NetworkType = 'testnet') => {
  switch (networkType) {
    case 'mainnet':
      return STACKS_MAINNET;
    case 'testnet':
      return STACKS_TESTNET;
    case 'mocknet':
      return STACKS_MOCKNET;
    default:
      return STACKS_MAINNET;
  }
};

// Environment-based network selection
export const getCurrentNetwork = (): NetworkType => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_STACKS_NETWORK as NetworkType || 'testnet';
  }
  return process.env.NEXT_PUBLIC_STACKS_NETWORK as NetworkType || 'mainnet';
};

export const STACKS_NETWORK = getNetwork(getCurrentNetwork());

export const NETWORK_CONFIG = {
  network: STACKS_NETWORK,
  type: getCurrentNetwork(),
  isMainnet: getCurrentNetwork() === 'mainnet',
  contract: SBTC_CONTRACT[getCurrentNetwork()]
};

// sBTC has 8 decimal places (100,000,000 microunits = 1 sBTC)
export const MICROUNITS_PER_SBTC = 100000000;