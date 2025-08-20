'use client';

import { useState, useEffect, useCallback } from 'react';
import useWalletStore from '@/stores/WalletStore';
import { validateStacksAddress } from '@/lib/stacks/sbtc';
import { type NetworkType } from '@/lib/stacks/config';

export interface WalletState {
  isConnected: boolean;
  userAddress: string | null;
  network: NetworkType;
  balance: number | null;
  loading: boolean;
  error: string | null;
}

export interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  validateAddress: (address: string) => boolean;
}

export const useStacksWallet = (): WalletState & WalletActions => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isConnected,
    currentAddress,
    network,
    balance,
    connectWallet,
    disconnectWallet,
    fetchBalance
  } = useWalletStore();

  // Auto-refresh balance periodically when connected
  useEffect(() => {
    if (isConnected && currentAddress) {
      // Initial fetch
      fetchBalance(currentAddress);
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        fetchBalance(currentAddress);
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isConnected, currentAddress, fetchBalance]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await connectWallet();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [connectWallet]);

  const disconnect = useCallback(() => {
    try {
      disconnectWallet();
      setError(null);
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  }, [disconnectWallet]);

  const refreshBalance = useCallback(async () => {
    if (!currentAddress) {
      console.warn('No user address available for balance refresh');
      return;
    }
    
    setLoading(true);
    try {
      await fetchBalance(currentAddress);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  }, [currentAddress, fetchBalance]);

  const validateAddress = useCallback((address: string) => {
    return validateStacksAddress(address, network);
  }, [network]);

  return {
    isConnected,
    userAddress: currentAddress || null,
    network,
    balance: balance.sbtc > 0 ? balance.sbtc * 100_000_000 : null, // Convert to microunits for compatibility
    loading,
    error,
    connect,
    disconnect,
    refreshBalance,
    validateAddress
  };
};