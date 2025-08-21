'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/auth/client';

interface ChartData {
  date: string;
  day: string;
  amount: number;
  count: number;
}

export function PaymentChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/v1/dashboard/stats', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const data = await response.json();
      setChartData(data.chartData.daily || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Volume (7 days)</h3>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Volume (7 days)</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Failed to load chart data: {error}</p>
            <button 
              onClick={fetchChartData}
              className="mt-2 text-sm text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const maxPayments = Math.max(...chartData.map(d => d.count), 1);
  const formatAmount = (amount: number) => (amount / 100_000_000).toFixed(6);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Volume (7 days)</h3>
        <div className="space-y-4">
          {chartData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-12 text-xs text-gray-500">{day.day}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(day.count / maxPayments) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 w-16">
                    {day.count} payments
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 w-20 text-right">
                {formatAmount(day.amount)} sBTC
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}