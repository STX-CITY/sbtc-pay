import { Suspense } from 'react';
import { PaymentStats } from '@/components/dashboard/payment-stats';
import { RecentPayments } from '@/components/dashboard/recent-payments';
import { PaymentChart } from '@/components/dashboard/payment-chart';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to your sBTC payment gateway dashboard.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/products"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Products
          </Link>
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Product
          </Link>
        </div>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <PaymentStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading chart...</div>}>
          <PaymentChart />
        </Suspense>
        
        <Suspense fallback={<div>Loading payments...</div>}>
          <RecentPayments />
        </Suspense>
      </div>
    </div>
  );
}