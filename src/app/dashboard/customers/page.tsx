'use client';

import { CustomerList } from '@/components/customers/customer-list';

export default function CustomersPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Customers</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          View and manage your customers who have made successful payments
        </p>
      </div>

      <CustomerList />
    </div>
  );
}