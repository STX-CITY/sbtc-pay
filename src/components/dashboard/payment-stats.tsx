'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/auth/client';

interface DashboardStats {
  totalRevenue: {
    amount: number;
    formatted: string;
    count: number;
    currency: string;
  };
  monthlyRevenue: {
    amount: number;
    formatted: string;
    count: number;
    change: number;
    currency: string;
  };
  pendingPayments: {
    amount: number;
    formatted: string;
    count: number;
    currency: string;
  };
  failedPayments: {
    count: number;
  };
  activeProducts: {
    count: number;
  };
  successRate: {
    percentage: string;
  };
}

export function PaymentStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/dashboard/stats', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load dashboard stats: {error}</p>
        <button 
          onClick={fetchStats}
          className="mt-2 text-sm text-red-700 hover:text-red-900"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.formatted} sBTC</p>
        <p className="text-xs text-gray-600">{stats.totalRevenue.count} payments</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">This Month</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.monthlyRevenue.formatted} sBTC</p>
        <p className={`text-xs ${stats.monthlyRevenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {stats.monthlyRevenue.change >= 0 ? '+' : ''}{stats.monthlyRevenue.change.toFixed(1)}% from last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.successRate.percentage}%</p>
        <p className="text-xs text-gray-600">{stats.failedPayments.count} failed payments</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments.count}</p>
        <p className="text-xs text-orange-600">{stats.pendingPayments.formatted} sBTC value</p>
      </div>
    </div>
  );
}