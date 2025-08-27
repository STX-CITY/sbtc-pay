'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/auth/client';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';

interface PaymentLink {
  id: string;
  product_id: string;
  product_name: string;
  link_code: string;
  email?: string;
  metadata?: Record<string, any>;
  created_at: string;
  used_count: number;
  last_used_at?: string;
  is_active: boolean;
  expires_at?: string;
}

export default function PaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      const response = await fetch('/api/v1/payment-links', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment links');
      }

      const data = await response.json();
      setPaymentLinks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (productId: string, email?: string, metadata?: Record<string, any>, linkId?: string) => {
    const baseUrl = `${window.location.origin}/checkout/product/${productId}`;
    const params = new URLSearchParams();
    
    if (email) {
      params.append('email', email);
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      // Filter out internal tracking fields
      const cleanMetadata = Object.fromEntries(
        Object.entries(metadata).filter(([key]) => !key.startsWith('_'))
      );
      if (Object.keys(cleanMetadata).length > 0) {
        params.append('metadata', JSON.stringify(cleanMetadata));
      }
    }
    
    const fullUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLinkId(linkId || productId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/v1/payment-links/${linkId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment link');
      }

      // Refresh the list
      fetchPaymentLinks();
    } catch (err) {
      console.error('Error updating payment link:', err);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this payment link?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/payment-links/${linkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment link');
      }

      // Remove from list
      setPaymentLinks(paymentLinks.filter(link => link.id !== linkId));
    } catch (err) {
      console.error('Error deleting payment link:', err);
      alert('Failed to delete payment link');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchPaymentLinks}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
          <p className="text-gray-600 mt-1">Manage your generated payment links</p>
        </div>
        <Link
          href="/dashboard/products"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate New Link
        </Link>
      </div>

      {paymentLinks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links yet</h3>
          <p className="text-gray-500 mb-4">Generate your first payment link from the products page</p>
          <Link
            href="/dashboard/products"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Products
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {paymentLinks.map((link) => (
              <li key={link.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {link.product_name}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${
                          link.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-6">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            Code: {link.link_code}
                          </p>
                          {link.email && (
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              {link.email}
                            </p>
                          )}
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Used {link.used_count} times
                          </p>
                        </div>
                      </div>

                      {link.metadata && (() => {
                        const cleanMetadata = Object.fromEntries(
                          Object.entries(link.metadata).filter(([key]) => !key.startsWith('_') && !key.startsWith('product_'))
                        );
                        return Object.keys(cleanMetadata).length > 0 ? (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Metadata: {JSON.stringify(cleanMetadata)}
                            </p>
                          </div>
                        ) : null;
                      })()}

                      <div className="mt-2 text-sm text-gray-500">
                        <p>Created: {new Date(link.created_at).toLocaleString()}</p>
                        {link.last_used_at && (
                          <p>Last used: {new Date(link.last_used_at).toLocaleString()}</p>
                        )}
                        {link.expires_at && (
                          <p className="text-amber-600">
                            Expires: {new Date(link.expires_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => copyLink(link.product_id, link.email, link.metadata, link.id)}
                        className={`px-3 py-1 text-sm rounded transition-all ${
                          copiedLinkId === link.id
                            ? 'bg-green-50 text-green-600'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {copiedLinkId === link.id ? '✓ Copied' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => toggleLinkStatus(link.id, link.is_active)}
                        className={`px-3 py-1 text-sm rounded ${
                          link.is_active 
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {link.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}