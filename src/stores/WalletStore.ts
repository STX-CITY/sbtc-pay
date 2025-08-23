import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { showConnect, disconnect, getLocalStorage } from '@stacks/connect';
import { getNetwork, getCurrentNetwork, type NetworkType } from '@/lib/stacks/config';
import { fetchBlockHeight } from '@/lib/stacks/blockheight';

// Define the types for the store's state and actions
interface AddressData {
  address: string;
  publicKey?: string;
  symbol?: string;
}

interface UserData {
  profile: {
    stxAddress: {
      mainnet: string;
      testnet: string;
    };
    btcAddress: {
      [key: string]: string;
    };
    addresses?: AddressData[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface WalletStoreState {
  userData: UserData | null;
  network: NetworkType;
  isConnected: boolean;
  publicKey: string;
  currentAddress: string;
  blockHeight: number;
  balance: {
    sbtc: number;
    stx: number;
  };
}

interface WalletStoreActions {
  setUserData: (userData: UserData | null) => void;
  setNetwork: (network: NetworkType) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  handleNetworkChange: (network: NetworkType) => void;
  fetchBalance: (address: string) => Promise<void>;
  fetchBlockHeight: () => Promise<void>;
  setCurrentAddress: (address: string) => void;
}

type WalletStore = WalletStoreState & WalletStoreActions;

function parseLocalData(localData: any) {
  if (!localData || !localData.addresses) {
    return null;
  }
  
  return {
    btc: (localData.addresses?.btc || []).map((item: any) => item.address),
    stx: (localData.addresses?.stx || []).map((item: any) => item.address),
    updatedAt: localData.updatedAt,
    version: localData.version
  };
}

const useWalletStore = create(
  persist<WalletStore>(
    (set, get) => ({
      // Initial state
      userData: null,
      network: getCurrentNetwork(),
      isConnected: false,
      publicKey: '',
      currentAddress: '',
      blockHeight: 0,
      balance: {
        sbtc: 0,
        stx: 0
      },

      // Actions
      setUserData: (userData) => set({ userData, isConnected: !!userData }),
      
      setNetwork: (network) => set({ network }),
      
      setCurrentAddress: (address) => set({ currentAddress: address }),

      connectWallet: async () => {
        try {
          const networkType = get().network;
          
          await new Promise<void>((resolve, reject) => {
            showConnect({
              appDetails: {
                name: 'sBTC Payment Gateway',
                icon: window.location.origin + '/icon.png'
              },
              onFinish: (data: any) => {
                console.log('Wallet connection data:', data);
                
                // Check local storage for address data
                const localData = getLocalStorage();
                const parsedData = parseLocalData(localData);
                
                let mainnetAddress = '';
                let testnetAddress = '';
                
                // Try to get addresses from parsed local data
                if (parsedData && parsedData.stx && parsedData.stx.length > 0) {
                  // Use the first STX address
                  const stxAddress = parsedData.stx[0];
                  
                  // Determine if it's mainnet or testnet based on prefix
                  if (stxAddress.startsWith('SP')) {
                    mainnetAddress = stxAddress;
                  } else if (stxAddress.startsWith('ST')) {
                    testnetAddress = stxAddress;
                  }
                }
                
                // Fallback to data from connection response
                if (!mainnetAddress && !testnetAddress && data.authResponse?.profile?.stxAddress) {
                  mainnetAddress = data.authResponse.profile.stxAddress.mainnet || '';
                  testnetAddress = data.authResponse.profile.stxAddress.testnet || '';
                }
                
                const newUserData: UserData = {
                  profile: {
                    stxAddress: {
                      mainnet: mainnetAddress,
                      testnet: testnetAddress
                    },
                    btcAddress: parsedData?.btc ? 
                      { mainnet: parsedData.btc[0] || '', testnet: parsedData.btc[0] || '' } : 
                      {},
                    addresses: localData?.addresses?.stx || []
                  },
                  authResponse: data.authResponse,
                  userSession: data.userSession
                };
                
                // Set the appropriate address - use whatever address is available
                // If network is testnet but only mainnet address exists, still set it
                // This allows the merchant-login component to detect and handle the mismatch
                let currentAddress = '';
                if (networkType === 'testnet') {
                  currentAddress = testnetAddress || mainnetAddress;
                } else {
                  currentAddress = mainnetAddress || testnetAddress;
                }
                
                set({ 
                  userData: newUserData, 
                  isConnected: true,
                  currentAddress,
                  publicKey: data.authResponse?.profile?.publicKey || ''
                });
                
                // Fetch balance and block height for the connected address
                if (currentAddress) {
                  get().fetchBalance(currentAddress);
                }
                // get().fetchBlockHeight();
                
                resolve();
              },
              onCancel: () => {
                console.log('User cancelled wallet connection');
                reject(new Error('User cancelled wallet connection'));
              }
            });
          });
        } catch (error) {
          console.error('Error connecting wallet:', error);
          throw error;
        }
      },

      disconnectWallet: () => {
        disconnect();
        set({ 
          userData: null, 
          isConnected: false, 
          currentAddress: '',
          publicKey: '',
          balance: { sbtc: 0, stx: 0 }
        });
      },

      handleNetworkChange: (network) => {
        const userData = get().userData;
        set({ network });
        
        if (userData) {
          // Update current address based on new network
          const newAddress = network === 'mainnet' 
            ? userData.profile.stxAddress.mainnet 
            : userData.profile.stxAddress.testnet;
          
          set({ currentAddress: newAddress });
          
          // Fetch balance for new network
          if (newAddress) {
            get().fetchBalance(newAddress);
          }
        }
      },

      fetchBalance: async (address) => {
        if (!address) return;
        
        try {
          const network = get().network;
          
          // Fetch STX balance from Stacks API
          const stxApiUrl = network === 'mainnet'
            ? 'https://api.stacks.co'
            : 'https://api.testnet.stacks.co';
          
          const stxResponse = await fetch(`${stxApiUrl}/extended/v1/address/${address}/balances`);
          let stxBalance = 0;
          
          if (stxResponse.ok) {
            const stxData = await stxResponse.json();
            stxBalance = parseInt(stxData.stx?.balance || '0') / 1_000_000;
          }
          
          // Fetch sBTC balance from our API (which uses Hiro API)
          const sbtcResponse = await fetch(`/api/v1/public/balance/${address}`);
          let sbtcBalance = 0;
          
          if (sbtcResponse.ok) {
            const sbtcData = await sbtcResponse.json();
            sbtcBalance = sbtcData.sbtc_amount || 0;
          }
          
          set({ 
            balance: { 
              stx: stxBalance, 
              sbtc: sbtcBalance 
            } 
          });
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      },

      fetchBlockHeight: async () => {
        try {
          const network = get().network;
          const blockHeight = await fetchBlockHeight(network);
          set({ blockHeight });
        } catch (error) {
          console.error('Error fetching block height:', error);
        }
      }
    }),
    {
      name: 'wallet-storage'
    }
  )
);

export default useWalletStore;