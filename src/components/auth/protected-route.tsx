'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useWalletStore from '@/stores/WalletStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { isConnected, currentAddress, connectWallet } = useWalletStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, [isConnected, currentAddress]);

  const checkAuthentication = async () => {
    try {
      // First check if wallet is connected
      if (!isConnected || !currentAddress) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Check if this address is registered as a merchant
      const response = await fetch('/api/v1/merchants/check-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: currentAddress })
      });

      const data = await response.json();

      if (response.ok && data.registered) {
        // Store merchant data for API access
        const merchantData = data.merchant;
        localStorage.setItem('api_key', merchantData.apiKeyTest);
        localStorage.setItem('merchant_id', merchantData.id);
        localStorage.setItem('merchant_address', merchantData.stacksAddress);
        
        setIsAuthenticated(true);
      } else {
        // Address not registered
        localStorage.removeItem('api_key');
        localStorage.removeItem('merchant_id');
        localStorage.removeItem('merchant_address');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, show login options
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          
          {!isConnected ? (
            <>
              <p className="text-gray-600 mb-6">Connect your wallet to access the dashboard</p>
              <button
                onClick={connectWallet}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mb-3"
              >
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Wallet connected but address not registered as merchant
              </p>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-xs text-gray-600">Connected Address:</p>
                <p className="text-xs font-mono">{currentAddress}</p>
              </div>
            </>
          )}
          
          <div className="space-y-2 text-sm">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Register as Merchant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated, show children
  return <>{children}</>;
}