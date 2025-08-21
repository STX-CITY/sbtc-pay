'use client';

import { useState, useEffect } from 'react';
import { PaymentsOverview } from '@/components/dashboard/payments-overview';
import { PaymentsTable } from '@/components/dashboard/payments-table';
import { PaymentIntentResponse } from '@/types/api';
import { getAuthHeaders } from '@/lib/auth/client';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentIntentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'succeeded' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchPayments(1);
  }, []);

  const fetchPayments = async (page: number = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const response = await fetch(`/api/v1/payment_intents?limit=${pageSize}&offset=${offset}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const newPayments = data.data || [];
        
        setPayments(newPayments);
        setHasMore(data.has_more || false);
        setTotalCount(data.total || newPayments.length);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch payments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNextPage = () => {
    if (!loading && hasMore) {
      fetchPayments(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (!loading && currentPage > 1) {
      fetchPayments(currentPage - 1);
    }
  };

  const refresh = () => {
    fetchPayments(currentPage);
  };

  const filteredPayments = payments.filter(payment => {
    if (filter !== 'all' && payment.status !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        payment.id.toLowerCase().includes(search) ||
        payment.description?.toLowerCase().includes(search) ||
        payment.customer_email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    all: payments.length,
    succeeded: payments.filter(p => p.status === 'succeeded').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    refunded: 0,
    disputed: 0,
    uncaptured: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create payment
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-gray-200 -mb-px">
            <button className="py-3 px-1 border-b-2 border-indigo-600 text-sm font-medium text-indigo-600">
              Payments
            </button>
            <button className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Payouts
            </button>
            <button className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Collected fees
            </button>
            <button className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Transfers
            </button>
            <button className="py-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              All activity
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <PaymentsOverview 
          stats={stats}
          filter={filter}
          onFilterChange={setFilter}
        />

        {/* Payments Table */}
        <PaymentsTable
          payments={filteredPayments}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={refresh}
          currentPage={currentPage}
          hasMore={hasMore}
          totalCount={totalCount}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
        />
      </div>
    </div>
  );
}