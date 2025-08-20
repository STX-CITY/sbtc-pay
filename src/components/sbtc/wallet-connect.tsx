'use client';

import React from 'react';
import { useStacksWallet } from '@/hooks/useStacksWallet';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  showBalance?: boolean;
}

export function WalletConnect({ onConnect, onDisconnect, showBalance = true }: WalletConnectProps) {
  const { 
    isConnected, 
    userAddress, 
    balance, 
    loading, 
    error,
    connect,
    disconnect,
    refreshBalance
  } = useStacksWallet();

  // Trigger callbacks when connection state changes
  React.useEffect(() => {
    if (isConnected && userAddress) {
      onConnect(userAddress);
    } else {
      onDisconnect();
    }
  }, [isConnected, userAddress, onConnect, onDisconnect]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        <p>Error: {error}</p>
        <button
          onClick={handleConnect}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isConnected && userAddress) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm space-y-1">
            <div className="font-medium">
              {userAddress.slice(0, 8)}...{userAddress.slice(-8)}
            </div>
            {showBalance && balance !== null && (
              <div className="text-gray-600 text-xs">
                Balance: {formatSBTCAmount(balance)} sBTC
                <button 
                  onClick={refreshBalance}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  disabled={loading}
                >
                  {loading ? '↻' : '⟳'}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        loading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}