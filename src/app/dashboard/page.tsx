import { Suspense } from 'react';
import { PaymentStats } from '@/components/dashboard/payment-stats';
import { RecentPayments } from '@/components/dashboard/recent-payments';
import { PaymentChart } from '@/components/dashboard/payment-chart';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to your sBTC payment gateway dashboard.</p>
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