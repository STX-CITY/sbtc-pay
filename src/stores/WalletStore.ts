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
                  // Check all STX addresses to find both mainnet and testnet
                  parsedData.stx.forEach((stxAddress: string) => {
                    if (stxAddress.startsWith('SP')) {
                      mainnetAddress = stxAddress;
                    } else if (stxAddress.startsWith('ST')) {
                      testnetAddress = stxAddress;
                    }
                  });
                }
                
                // Fallback to data from connection response
                if (data.authResponse?.profile?.stxAddress) {
                  if (!mainnetAddress && data.authResponse.profile.stxAddress.mainnet) {
                    mainnetAddress = data.authResponse.profile.stxAddress.mainnet;
                  }
                  if (!testnetAddress && data.authResponse.profile.stxAddress.testnet) {
                    testnetAddress = data.authResponse.profile.stxAddress.testnet;
                  }
                }
                
                console.log('Address detection:', { 
                  networkType, 
                  mainnetAddress, 
                  testnetAddress,
                  parsedData: parsedData?.stx 
                });
                
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
                
                // Check for network mismatch only when user has ONLY the wrong network address
                if (networkType === 'testnet' && mainnetAddress && !testnetAddress) {
                  console.log('Blocking mainnet wallet on testnet');
                  alert(
                    '⚠️ Mainnet Wallet Detected!\n\n' +
                    'You are connected with a mainnet wallet (address starts with "SP"), but this application is configured for testnet.\n\n' +
                    'Please:\n' +
                    '1. Disconnect your current wallet\n' +
                    '2. Switch to a testnet wallet or create a testnet address\n' +
                    '3. Reconnect with your testnet wallet\n\n' +
                    'Testnet addresses start with "ST".'
                  );
                  
                  reject(new Error('Mainnet wallet not supported on testnet'));
                  return;
                }
                
                if (networkType === 'mainnet' && testnetAddress && !mainnetAddress) {
                  console.log('Blocking testnet wallet on mainnet');
                  alert(
                    '⚠️ Testnet Wallet Detected!\n\n' +
                    'You are connected with a testnet wallet (address starts with "ST"), but this application is configured for mainnet.\n\n' +
                    'Please:\n' +
                    '1. Disconnect your current wallet\n' +
                    '2. Switch to a mainnet wallet or create a mainnet address\n' +
                    '3. Reconnect with your mainnet wallet\n\n' +
                    'Mainnet addresses start with "SP".'
                  );
                  
                  reject(new Error('Testnet wallet not supported on mainnet'));
                  return;
                }
                
                // If we have no address at all for the current network, show a different message
                if (networkType === 'testnet' && !testnetAddress && !mainnetAddress) {
                  alert(
                    '⚠️ No Address Found!\n\n' +
                    'No Stacks address was found in your wallet. Please make sure your wallet is properly set up.'
                  );
                  
                  reject(new Error('No address found'));
                  return;
                }
                
                if (networkType === 'mainnet' && !mainnetAddress && !testnetAddress) {
                  alert(
                    '⚠️ No Address Found!\n\n' +
                    'No Stacks address was found in your wallet. Please make sure your wallet is properly set up.'
                  );
                  
                  reject(new Error('No address found'));
                  return;
                }

                // Set the appropriate address
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
          const mainnetAddress = userData.profile.stxAddress.mainnet;
          const testnetAddress = userData.profile.stxAddress.testnet;
          
          // Check for network mismatch only when user has ONLY the wrong network address
          if (network === 'testnet' && mainnetAddress && !testnetAddress) {
            console.log('Network change: Disconnecting mainnet-only wallet on testnet');
            alert(
              '⚠️ Mainnet Wallet Detected!\n\n' +
              'You switched to testnet but your connected wallet only has a mainnet address (starts with "SP").\n\n' +
              'Please disconnect and reconnect with a testnet wallet (address starts with "ST").'
            );
            
            get().disconnectWallet();
            return;
          }
          
          if (network === 'mainnet' && testnetAddress && !mainnetAddress) {
            console.log('Network change: Disconnecting testnet-only wallet on mainnet');
            alert(
              '⚠️ Testnet Wallet Detected!\n\n' +
              'You switched to mainnet but your connected wallet only has a testnet address (starts with "ST").\n\n' +
              'Please disconnect and reconnect with a mainnet wallet (address starts with "SP").'
            );
            
            get().disconnectWallet();
            return;
          }
          
          const newAddress = network === 'mainnet' 
            ? mainnetAddress 
            : testnetAddress;
          
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