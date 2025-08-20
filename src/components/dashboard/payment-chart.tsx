'use client';

import { useState, useEffect } from 'react';

interface ChartData {
  date: string;
  payments: number;
  volume: number;
}

export function PaymentChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - would fetch from API
    setTimeout(() => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          payments: Math.floor(Math.random() * 20) + 5,
          volume: parseFloat((Math.random() * 2 + 0.5).toFixed(4))
        };
      });
      setChartData(last7Days);
      setLoading(false);
    }, 800);
  }, []);

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

  const maxPayments = Math.max(...chartData.map(d => d.payments));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Volume (7 days)</h3>
        <div className="space-y-4">
          {chartData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-12 text-xs text-gray-500">{day.date}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(day.payments / maxPayments) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 w-16">
                    {day.payments} payments
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 w-20 text-right">
                {day.volume} sBTC
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}