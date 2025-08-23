'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';
import { getAuthHeaders } from '@/lib/auth/client';

interface Customer {
  id: string;
  address?: string;
  email?: string;
  total_spent: number;
  total_spent_usd?: number;
  currency: string;
  payment_count: number;
  last_payment: number;
  transactions: {
    tx_id: string;
    amount: number;
    amount_usd?: number;
    product_id?: string;
    product_name?: string;
    date: number;
  }[];
}

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/v1/customers?limit=50', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const toggleCustomerDetails = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchCustomers}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
        <p className="text-gray-500 mb-4">Customers will appear here after they make successful payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {customers.map((customer) => (
            <li key={customer.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {customer.email 
                              ? customer.email.charAt(0).toUpperCase()
                              : customer.address 
                                ? customer.address.substring(0, 2).toUpperCase()
                                : '?'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.email || customer.address || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.payment_count} payment{customer.payment_count !== 1 ? 's' : ''} • Last: {formatDate(customer.last_payment)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.total_spent_usd 
                          ? `$${customer.total_spent_usd.toFixed(2)}`
                          : `${formatSBTCAmount(customer.total_spent)} sBTC`
                        }
                      </div>
                      {customer.total_spent_usd && (
                        <div className="text-xs text-gray-500">
                          ≈ {formatSBTCAmount(customer.total_spent)} sBTC
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleCustomerDetails(customer.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {expandedCustomer === customer.id ? 'Hide' : 'View'} Details
                    </button>
                  </div>
                </div>
                
                {expandedCustomer === customer.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction History</h4>
                    <div className="space-y-2">
                      {customer.transactions.map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">
                              {formatDate(transaction.date)}
                            </div>
                            <div className="text-sm text-gray-900">
                              TX: {transaction.tx_id}
                            </div>
                            {transaction.product_id && (
                              <div className="text-xs text-gray-500">
                                Product: {transaction.product_name ? (
                                  <Link 
                                    href={`/dashboard/products/${transaction.product_id}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {transaction.product_name}
                                  </Link>
                                ) : (
                                  transaction.product_id
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {transaction.amount_usd 
                                ? `$${transaction.amount_usd.toFixed(2)}`
                                : `${formatSBTCAmount(transaction.amount)} sBTC`
                              }
                            </div>
                            {transaction.amount_usd && (
                              <div className="text-xs text-gray-500">
                                ≈ {formatSBTCAmount(transaction.amount)} sBTC
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}