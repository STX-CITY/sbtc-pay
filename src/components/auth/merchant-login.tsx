'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useWalletStore from '@/stores/WalletStore';

interface MerchantData {
  id: string;
  name: string;
  email: string;
  stacksAddress: string;
  apiKeyTest: string;
  created: number;
}

export function MerchantLogin() {
  const router = useRouter();
  const { isConnected, currentAddress, connectWallet, disconnectWallet, network } = useWalletStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMainnetWallet, setIsMainnetWallet] = useState(false);

  const handleWalletLogin = async () => {
    if (isConnected) {
      // If already connected, just re-check registration
      setLoading(true);
      setError(null);
      checkMerchantRegistration(currentAddress);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Connect the wallet (registration check will happen automatically via useEffect)
      await connectWallet();
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      setLoading(false);
    }
  };

  const handleDisconnectAndSwitch = () => {
    disconnectWallet();
    setIsMainnetWallet(false);
    setError(null);
  };

  const checkMerchantRegistration = async (address: string) => {
    try {
      const response = await fetch('/api/v1/merchants/check-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to check registration');
      }

      if (!data.registered) {
        setError(data.message || 'Address not registered. Please register first.');
        return;
      }

      // Store merchant data for authentication
      const merchantData: MerchantData = data.merchant;
      localStorage.setItem('api_key', merchantData.apiKeyTest);
      localStorage.setItem('merchant_id', merchantData.id);
      localStorage.setItem('merchant_address', merchantData.stacksAddress);

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify registration');
    } finally {
      setLoading(false);
    }
  };

  // Check registration when wallet is connected
  useEffect(() => {
    if (isConnected && currentAddress) {
      // Check if using mainnet wallet (address starts with SP)
      if (currentAddress.startsWith('SP')) {
        setIsMainnetWallet(true);
        setError('Mainnet wallet detected. Please disconnect and switch to testnet.');
        setLoading(false);
        return;
      }
      // Auto-check registration when wallet connects
      setLoading(true);
      checkMerchantRegistration(currentAddress);
    }
  }, [isConnected, currentAddress]);

  // Check for mainnet wallet on network change
  useEffect(() => {
    if (isConnected && currentAddress) {
      if (currentAddress.startsWith('SP') || network === 'mainnet') {
        setIsMainnetWallet(true);
        setError('Mainnet wallet detected. Please disconnect and switch to testnet.');
      } else {
        setIsMainnetWallet(false);
      }
    }
  }, [network, currentAddress, isConnected]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Merchant Login</h2>
        <p className="text-gray-600">Connect your wallet to access your dashboard</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
          {isMainnetWallet && (
            <button
              onClick={handleDisconnectAndSwitch}
              className="mt-2 block w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
            >
              Disconnect Wallet & Switch Network
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-medium text-yellow-900 mb-2">⚠️ Testnet Only</h3>
          <p className="text-sm text-yellow-800">
            This application currently supports testnet wallets only. Please ensure your wallet is connected to testnet before proceeding.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Connect your Stacks wallet (testnet)</li>
            <li>2. We check if your address is registered</li>
            <li>3. Access your merchant dashboard</li>
          </ul>
        </div>

        <button
          onClick={handleWalletLogin}
          disabled={loading || isMainnetWallet}
          className={`w-full py-3 px-4 rounded font-medium ${
            loading || isMainnetWallet
              ? 'bg-gray-400 cursor-not-allowed' 
              : isConnected
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Verifying Registration...' : isMainnetWallet ? 'Please switch to testnet' : isConnected ? 'Retry Verification' : 'Connect Wallet (Testnet)'}
        </button>
        
        {isConnected && !loading && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Connected Address:</p>
            <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
              {currentAddress}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Don't have an account?{' '}
          <a href="/register" className="text-blue-500 hover:text-blue-700">
            Register as merchant
          </a>
        </p>
      </div>
    </div>
  );
}