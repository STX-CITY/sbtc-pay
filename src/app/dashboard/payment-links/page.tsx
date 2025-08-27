'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/auth/client';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';
import { ProductDropdown } from '@/components/dashboard/product-dropdown';
import { CheckoutPreview } from '@/components/dashboard/checkout-preview';
import { Product } from '@/types/products';

interface MetadataField {
  key: string;
  value: string;
}

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [customFields, setCustomFields] = useState<MetadataField[]>([{ key: '', value: '' }]);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);

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

  const generatePaymentLink = () => {
    if (!selectedProduct) return '';
    
    const baseUrl = `${window.location.origin}/checkout/product/${selectedProduct.id}`;
    const params = new URLSearchParams();
    
    // Add metadata fields to URL
    const validMetadata = customFields.filter(field => field.key && field.value);
    if (validMetadata.length > 0) {
      const metadataObj: Record<string, string> = {};
      validMetadata.forEach(field => {
        metadataObj[field.key] = field.value;
      });
      params.append('metadata', JSON.stringify(metadataObj));
    }
    
    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    return finalUrl;
  };

  const handleGenerateLink = () => {
    const link = generatePaymentLink();
    setGeneratedLink(link);
    setShowQRCode(true);
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

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    if (customFields.length > 1) {
      setCustomFields(customFields.filter((_, i) => i !== index));
    }
  };

  const resetGenerator = () => {
    setSelectedProduct(null);
    setCustomFields([{ key: '', value: '' }]);
    setGeneratedLink('');
    setShowQRCode(false);
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
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showGenerator ? 'Hide Generator' : 'Generate New Link'}
        </button>
      </div>

      {/* Payment Link Generator */}
      {showGenerator && (
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create a Payment Link</h2>
              <p className="text-sm text-gray-600 mt-1">Select a product and preview the checkout form</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left side - Configuration */}
              <div className="space-y-6">
                
               

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product
                  </label>
                  <ProductDropdown
                    selectedProduct={selectedProduct}
                    onProductSelect={setSelectedProduct}
                    className="mb-4"
                  />
                  
                </div>

                {/* Custom Fields */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Fields (Optional)
                    </label>
                    <button
                      onClick={addCustomField}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Field
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                          placeholder="Field name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                          placeholder="Default value"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {customFields.length > 1 && (
                          <button
                            onClick={() => removeCustomField(index)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add custom fields that customers will fill in the checkout form
                  </p>
                </div>

               

                {selectedProduct && (
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={handleGenerateLink}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                      >
                        Generate Link
                      </button>
                      <button
                        onClick={resetGenerator}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                      >
                        Reset
                      </button>
                    </div>
                    
                    {generatedLink && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Generated Payment Link
                        </label>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start justify-between">
                            <code className="text-sm text-blue-900 break-all flex-1 pr-2">
                              {generatedLink}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generatedLink);
                                setCopiedLinkId('generator');
                                setTimeout(() => setCopiedLinkId(null), 2000);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                              {copiedLinkId === 'generator' ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        
                        {/* QR Code Section */}
                        {showQRCode && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              QR Code
                            </label>
                            <div className="flex justify-center">
                              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedLink)}`} 
                                  alt="Payment Link QR Code"
                                  className="w-48 h-48"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              Scan this QR code to open the payment page
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right side - Preview */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
                <CheckoutPreview 
                  product={selectedProduct} 
                  customFields={customFields.filter(f => f.key && f.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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