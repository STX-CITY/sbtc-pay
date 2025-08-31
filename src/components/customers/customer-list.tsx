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
    payment_intent_metadata?: any;
    source_link_id?: string;
    payment_link_metadata?: any;
    payment_link_email?: string;
    payment_link_code?: string;
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
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{customer.payment_count} payment{customer.payment_count !== 1 ? 's' : ''} • Last: {formatDate(customer.last_payment)}</span>
                          {customer.transactions.some(t => t.source_link_id) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Link Purchase
                            </span>
                          )}
                          {customer.transactions.some(t => t.payment_link_metadata || t.payment_intent_metadata) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Metadata
                            </span>
                          )}
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
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">
                                {formatDate(transaction.date)}
                              </div>
                              <div className="text-sm text-gray-900 font-mono">
                                TX: {transaction.tx_id}
                              </div>
                              {transaction.product_id && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Product: {transaction.product_name ? (
                                    <Link 
                                      href={`/dashboard/products/${transaction.product_id}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
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

                          {/* Payment Link Information */}
                          {transaction.source_link_id && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-indigo-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="text-xs font-medium text-indigo-700">Payment Link Purchase</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {transaction.payment_link_code && (
                                  <div>
                                    <span className="text-gray-500">Link Code:</span>
                                    <span className="ml-1 font-mono text-gray-900">{transaction.payment_link_code}</span>
                                  </div>
                                )}
                                {transaction.payment_link_email && (
                                  <div>
                                    <span className="text-gray-500">Link Email:</span>
                                    <span className="ml-1 text-gray-900">{transaction.payment_link_email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Custom Metadata */}
                          {(transaction.payment_link_metadata || transaction.payment_intent_metadata) && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs font-medium text-green-700">Custom Metadata</span>
                              </div>
                              
                              {transaction.payment_link_metadata && (
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 mb-1">From Payment Link:</div>
                                  <div className="bg-white rounded border border-gray-200 p-2">
                                    {typeof transaction.payment_link_metadata === 'object' ? (
                                      <div className="space-y-1">
                                        {Object.entries(transaction.payment_link_metadata).map(([key, value]) => (
                                          <div key={key} className="flex text-xs">
                                            <span className="font-medium text-gray-600 min-w-0 flex-shrink-0">{key}:</span>
                                            <span className="ml-2 text-gray-900 break-words">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                                        {JSON.stringify(transaction.payment_link_metadata, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {transaction.payment_intent_metadata && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">From Payment Intent:</div>
                                  <div className="bg-white rounded border border-gray-200 p-2">
                                    {typeof transaction.payment_intent_metadata === 'object' ? (
                                      <div className="space-y-1">
                                        {Object.entries(transaction.payment_intent_metadata).map(([key, value]) => (
                                          <div key={key} className="flex text-xs">
                                            <span className="font-medium text-gray-600 min-w-0 flex-shrink-0">{key}:</span>
                                            <span className="ml-2 text-gray-900 break-words">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                                        {JSON.stringify(transaction.payment_intent_metadata, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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