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
  const [stats, setStats] = useState({
    all: 0,
    succeeded: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    disputed: 0,
    uncaptured: 0
  });
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
        
        // Update stats from API response
        if (data.stats) {
          setStats({
            all: data.stats.all || 0,
            succeeded: data.stats.succeeded || 0,
            pending: data.stats.pending || 0,
            failed: data.stats.failed || 0,
            refunded: 0, // Not supported yet
            disputed: 0, // Not supported yet
            uncaptured: 0 // Not supported yet
          });
        }
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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            </div>
            
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-gray-200 -mb-px">
            <button className="py-3 px-1 border-b-2 border-indigo-600 text-sm font-medium text-indigo-600">
              Payments
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