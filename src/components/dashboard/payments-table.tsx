'use client';

import { useState, useEffect, useRef } from 'react';
import { PaymentIntentResponse } from '@/types/api';

interface PaymentsTableProps {
  payments: PaymentIntentResponse[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export function PaymentsTable({ 
  payments, 
  loading, 
  searchTerm, 
  onSearchChange,
  onRefresh,
  currentPage,
  hasMore,
  totalCount,
  onNextPage,
  onPreviousPage
}: PaymentsTableProps) {
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date } | null>(null);
  const [amountFilter, setAmountFilter] = useState<{ min?: number; max?: number } | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.id));
    }
  };

  const handleSelectPayment = (id: string) => {
    if (selectedPayments.includes(id)) {
      setSelectedPayments(selectedPayments.filter(p => p !== id));
    } else {
      setSelectedPayments([...selectedPayments, id]);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100_000_000).toFixed(8);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      succeeded: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      created: 'bg-gray-100 text-gray-700',
      canceled: 'bg-gray-100 text-gray-700'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.created}`}>
        <svg className="w-1.5 h-1.5 mr-1" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    // Date filter
    if (dateFilter) {
      const paymentDate = new Date(payment.created * 1000);
      if (dateFilter.from && paymentDate < dateFilter.from) return false;
      if (dateFilter.to && paymentDate > dateFilter.to) return false;
    }
    
    // Amount filter
    if (amountFilter) {
      const amount = payment.amount / 100_000_000;
      if (amountFilter.min !== undefined && amount < amountFilter.min) return false;
      if (amountFilter.max !== undefined && amount > amountFilter.max) return false;
    }
    
    // Currency filter (for now we only have sBTC)
    if (currencyFilter && currencyFilter !== 'sBTC') return false;
    
    // Status filter
    if (statusFilter.length > 0 && !statusFilter.includes(payment.status)) return false;
    
    // Payment method filter (we'll use the last 4 digits of ID as a proxy)
    if (paymentMethodFilter && !payment.id.includes(paymentMethodFilter)) return false;
    
    return true;
  });
  
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'desc' 
        ? b.created - a.created 
        : a.created - b.created;
    } else if (sortField === 'amount') {
      return sortDirection === 'desc'
        ? b.amount - a.amount
        : a.amount - b.amount;
    }
    return 0;
  });
  
  const hasActiveFilters = dateFilter || amountFilter || currencyFilter || statusFilter.length > 0 || paymentMethodFilter;
  
  const clearFilters = () => {
    setDateFilter(null);
    setAmountFilter(null);
    setCurrencyFilter(null);
    setStatusFilter([]);
    setPaymentMethodFilter(null);
  };

  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = [
      'Payment ID',
      'Amount (sBTC)',
      'Amount (USD)',
      'Status',
      'Payment Method',
      'Description',
      'Customer Email',
      'Date Created',
      'Transaction Hash'
    ];

    // Prepare CSV rows using filtered and sorted payments
    const rows = sortedPayments.map(payment => [
      payment.id,
      formatAmount(payment.amount),
      payment.amount_usd ? payment.amount_usd.toFixed(2) : '',
      payment.status,
      `sBTC - ${payment.id.slice(-4)}`,
      payment.description || '',
      payment.customer_email || '',
      new Date(payment.created * 1000).toLocaleString(),
      payment.transaction_hash || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or quotes
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };
  
  // Close dropdowns when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filters Bar */}
      <div className="p-4 border-b border-gray-200" ref={dropdownRef}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('date')}
              className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 ${
                dateFilter ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date and time
              {dateFilter && <span className="ml-1 text-xs">•</span>}
            </button>
            {openDropdown === 'date' && (
              <div className="absolute top-full mt-1 left-0 z-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                    <input
                      type="date"
                      value={dateFilter?.from ? dateFilter.from.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateFilter(prev => ({ 
                        ...prev, 
                        from: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                    <input
                      type="date"
                      value={dateFilter?.to ? dateFilter.to.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateFilter(prev => ({ 
                        ...prev, 
                        to: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setDateFilter(null)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setOpenDropdown(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Filter */}
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('amount')}
              className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 ${
                amountFilter ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Amount
              {amountFilter && <span className="ml-1 text-xs">•</span>}
            </button>
            {openDropdown === 'amount' && (
              <div className="absolute top-full mt-1 left-0 z-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount (sBTC)</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={amountFilter?.min ?? ''}
                      onChange={(e) => setAmountFilter(prev => ({ 
                        ...prev, 
                        min: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0.00000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount (sBTC)</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={amountFilter?.max ?? ''}
                      onChange={(e) => setAmountFilter(prev => ({ 
                        ...prev, 
                        max: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0.00000000"
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setAmountFilter(null)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setOpenDropdown(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Currency Filter */}
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('currency')}
              className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 ${
                currencyFilter ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Currency
              {currencyFilter && <span className="ml-1 text-xs">•</span>}
            </button>
            {openDropdown === 'currency' && (
              <div className="absolute top-full mt-1 left-0 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                <button
                  onClick={() => {
                    setCurrencyFilter(currencyFilter === 'sBTC' ? null : 'sBTC');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between ${
                    currencyFilter === 'sBTC' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  <span>sBTC</span>
                  {currencyFilter === 'sBTC' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('status')}
              className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 ${
                statusFilter.length > 0 ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status
              {statusFilter.length > 0 && <span className="ml-1 text-xs">({statusFilter.length})</span>}
            </button>
            {openDropdown === 'status' && (
              <div className="absolute top-full mt-1 left-0 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                {['succeeded', 'pending', 'failed', 'created', 'canceled'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      if (statusFilter.includes(status)) {
                        setStatusFilter(statusFilter.filter(s => s !== status));
                      } else {
                        setStatusFilter([...statusFilter, status]);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between ${
                      statusFilter.includes(status) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="capitalize">{status}</span>
                    {statusFilter.includes(status) && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={() => setStatusFilter([])}
                    className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('payment')}
              className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 ${
                paymentMethodFilter ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment method
              {paymentMethodFilter && <span className="ml-1 text-xs">•</span>}
            </button>
            {openDropdown === 'payment' && (
              <div className="absolute top-full mt-1 left-0 z-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search by ID</label>
                    <input
                      type="text"
                      value={paymentMethodFilter || ''}
                      onChange={(e) => setPaymentMethodFilter(e.target.value || null)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Enter payment ID..."
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setPaymentMethodFilter(null)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setOpenDropdown(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* Export Button */}
            <button 
              onClick={exportToCSV}
              disabled={sortedPayments.length === 0}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export {sortedPayments.length > 0 && `(${sortedPayments.length})`}
            </button>

            
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPayments.length === payments.length && payments.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => {
                if (sortField === 'date') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('date');
                  setSortDirection('desc');
                }
              }}>
                <div className="flex items-center">
                  Date
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Refunded date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Decline reason
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  {hasActiveFilters ? 'No payments match the selected filters' : 'No payments found'}
                </td>
              </tr>
            ) : (
              sortedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(payment.amount)} sBTC
                        </div>
                        {payment.amount_usd && (
                          <div className="text-xs text-gray-500">
                            ${payment.amount_usd.toFixed(2)} USD
                          </div>
                        )}
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium mr-2">
                        sBTC
                      </span>
                      <span className="text-gray-500">•••• {payment.id.slice(-4)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {payment.description || payment.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {payment.customer_email || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(payment.created)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">—</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">—</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {payments.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to <span className="font-medium">{((currentPage - 1) * 10) + payments.length}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onPreviousPage}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage}
            </span>
            <button 
              onClick={onNextPage}
              disabled={!hasMore || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}