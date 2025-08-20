import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { showConnect, disconnect, getLocalStorage } from '@stacks/connect';
import { getNetwork, getCurrentNetwork, type NetworkType } from '@/lib/stacks/config';

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
          const networkConfig = getNetwork(networkType);
          
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
                    // For testnet, we'll use the same address structure but it would start with ST
                    testnetAddress = stxAddress.replace('SP', 'ST');
                  } else if (stxAddress.startsWith('ST')) {
                    testnetAddress = stxAddress;
                    mainnetAddress = stxAddress.replace('ST', 'SP');
                  }
                }
                
                // Fallback to data from connection response
                if (!mainnetAddress && data.authResponse?.profile?.stxAddress) {
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
                
                // Set the appropriate address based on current network
                const currentAddress = networkType === 'mainnet' ? mainnetAddress : testnetAddress;
                
                set({ 
                  userData: newUserData, 
                  isConnected: true,
                  currentAddress,
                  publicKey: data.authResponse?.profile?.publicKey || ''
                });
                
                // Fetch balance for the connected address
                if (currentAddress) {
                  get().fetchBalance(currentAddress);
                }
                
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
          const apiUrl = network === 'mainnet'
            ? 'https://api.stacks.co'
            : 'https://api.testnet.stacks.co';
          
          const response = await fetch(`${apiUrl}/extended/v1/address/${address}/balances`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch balance: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Get STX balance
          const stxBalance = parseInt(data.stx?.balance || '0') / 1_000_000;
          
          // Get sBTC balance
          // Look for sBTC token in fungible tokens
          let sbtcBalance = 0;
          if (data.fungible_tokens) {
            // Look for sBTC token contract
            for (const [contractId, tokenData] of Object.entries(data.fungible_tokens)) {
              if (contractId.includes('sbtc')) {
                sbtcBalance = parseInt((tokenData as any).balance || '0') / 100_000_000;
                break;
              }
            }
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
      }
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        userData: state.userData,
        network: state.network,
        currentAddress: state.currentAddress,
        publicKey: state.publicKey,
        isConnected: state.isConnected
      } as Pick<WalletStore, 'userData' | 'network' | 'currentAddress' | 'publicKey' | 'isConnected'>)
    }
  )
);

export default useWalletStore;