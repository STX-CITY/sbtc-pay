'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import useWalletStore from '@/stores/WalletStore';
import { clearAuth } from '@/lib/auth/client';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { disconnectWallet } = useWalletStore();
  
  const handleLogout = () => {
    // Clear authentication data
    clearAuth();
    
    // Disconnect wallet
    disconnectWallet();
    
    // Redirect to home
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b mt-9">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                sBTC Pay
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/products" 
                className="text-gray-600 hover:text-gray-900"
              >
                Products
              </Link>
              <Link 
                href="/dashboard/payments" 
                className="text-gray-600 hover:text-gray-900"
              >
                Payments
              </Link>
              <Link 
                href="/dashboard/developers" 
                className="text-gray-600 hover:text-gray-900"
              >
                Developers
              </Link>              
              <Link 
                href="/dashboard/settings" 
                className="text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <DashboardNavigation>
        {children}
      </DashboardNavigation>
    </ProtectedRoute>
  );
}