import { showConnect, disconnect, isConnected } from '@stacks/connect';
import { getNetwork, getCurrentNetwork, type NetworkType } from './config';

export interface WalletConfig {
  appName: string;
  appIcon: string;
  network?: NetworkType;
}

export interface WalletConnectionResult {
  userSession: any;
  userAddress: string;
  network: string;
}

export const connectWallet = async (config: WalletConfig): Promise<WalletConnectionResult> => {
  return new Promise((resolve, reject) => {
    try {
      const network = getNetwork(config.network || getCurrentNetwork());
      
      showConnect({
        appDetails: {
          name: config.appName || 'sBTC Payment Gateway',
          icon: config.appIcon || '/icon.png'
        },
        onFinish: (data: any) => {
          console.log('Wallet connected successfully:', data);
          const networkType = config.network || getCurrentNetwork();
          
          // Handle different response structures
          let address: string | undefined;
          
          // Try to get address from different possible locations
          if (data.authResponse) {
            // New Connect format - address comes directly in authResponse
            const profile = data.authResponse.profile;
            if (profile?.stxAddress) {
              address = profile.stxAddress[networkType] || 
                       profile.stxAddress.mainnet ||
                       profile.stxAddress.testnet;
            }
          } else if (data.userSession?.profile) {
            // Legacy format
            const profile = data.userSession.profile;
            if (profile.stxAddress) {
              address = profile.stxAddress[networkType] || 
                       profile.stxAddress.mainnet ||
                       profile.stxAddress.testnet;
            }
          }
          
          // If still no address, try to extract from authResponsePayload
          if (!address && data.authResponsePayload) {
            try {
              const decoded = JSON.parse(atob(data.authResponsePayload.split('.')[1]));
              if (decoded.profile?.stxAddress) {
                address = decoded.profile.stxAddress[networkType] || 
                         decoded.profile.stxAddress.mainnet ||
                         decoded.profile.stxAddress.testnet;
              }
            } catch (e) {
              console.warn('Could not decode authResponsePayload:', e);
            }
          }
          
          if (!address) {
            reject(new Error('Could not extract wallet address from connection response'));
            return;
          }
          
          resolve({
            userSession: data.userSession || data.authResponse,
            userAddress: address,
            network: networkType
          });
        },
        onCancel: () => {
          console.log('User cancelled wallet connection');
          reject(new Error('User cancelled wallet connection'));
        }
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      reject(new Error(`Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

export const checkConnection = (): boolean => {
  try {
    return isConnected();
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

export const disconnectWallet = (): void => {
  try {
    disconnect();
    console.log('Wallet disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
};