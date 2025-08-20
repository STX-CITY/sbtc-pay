'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalVolume: number;
  totalPayments: number;
  successRate: number;
  pendingPayments: number;
}

export function PaymentStats() {
  const [stats, setStats] = useState<Stats>({
    totalVolume: 0,
    totalPayments: 0,
    successRate: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - would fetch from API
    setTimeout(() => {
      setStats({
        totalVolume: 12.45, // sBTC
        totalPayments: 89,
        successRate: 98.5,
        pendingPayments: 3
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Volume</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.totalVolume.toFixed(4)} sBTC</p>
        <p className="text-xs text-green-600">+12.5% from last month</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
        <p className="text-xs text-green-600">+8.2% from last month</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
        <p className="text-xs text-green-600">+0.3% from last month</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
        <p className="text-xs text-orange-600">2 require attention</p>
      </div>
    </div>
  );
}