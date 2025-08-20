'use client';

import { useState, useEffect } from 'react';

interface Payment {
  id: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  customer: string;
  createdAt: string;
}

export function RecentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - would fetch from API
    setTimeout(() => {
      setPayments([
        {
          id: 'pi_1abc123',
          amount: 0.001,
          status: 'succeeded',
          customer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 'pi_2def456',
          amount: 0.0025,
          status: 'pending',
          customer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          createdAt: '2024-01-15T09:15:00Z'
        },
        {
          id: 'pi_3ghi789',
          amount: 0.005,
          status: 'succeeded',
          customer: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP',
          createdAt: '2024-01-15T08:45:00Z'
        },
        {
          id: 'pi_4jkl012',
          amount: 0.0015,
          status: 'failed',
          customer: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
          createdAt: '2024-01-15T08:00:00Z'
        }
      ]);
      setLoading(false);
    }, 1200);
  }, []);

  const getStatusBadge = (status: Payment['status']) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'succeeded':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{payment.id}</p>
                  <span className={getStatusBadge(payment.status)}>
                    {payment.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {payment.customer.slice(0, 8)}...{payment.customer.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {payment.amount.toFixed(6)} sBTC
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <button className="text-sm text-blue-600 hover:text-blue-500">
            View all payments →
          </button>
        </div>
      </div>
    </div>
  );
}