import { ReactNode } from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                sBTC Pay
              </Link>
            </div>
            <div className="flex items-center space-x-4">
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
                href="/dashboard/analytics" 
                className="text-gray-600 hover:text-gray-900"
              >
                Analytics
              </Link>
              <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
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