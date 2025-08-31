'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';
import { getAuthHeaders } from '@/lib/auth/client';
import { PaymentLinkGenerator } from '@/components/dashboard/payment-link-generator';

interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  price_usd?: number;
  currency: string;
  images?: string[];
  metadata?: any;
  active: boolean;
  created: number;
  updated: number;
}

// Compatible with both Next.js 14 and 15 patterns
export default function ProductDetailsPage({ params }: any) {
  const router = useRouter();
  const [productId, setProductId] = useState<string>('');
  
  // Handle both Promise and non-Promise params
  useEffect(() => {
    if (params && typeof params === 'object') {
      if ('then' in params) {
        // It's a Promise (Next.js 15 style)
        (params as Promise<{ id: string }>).then(resolvedParams => {
          setProductId(resolvedParams.id);
        });
      } else {
        // It's a regular object (Next.js 14 style)
        setProductId((params as { id: string }).id);
      }
    }
  }, [params]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinkGeneratorOpen, setIsLinkGeneratorOpen] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      // Get auth headers safely
      let headers: Record<string, string> = {};
      try {
        headers = getAuthHeaders();
      } catch (authError) {
        console.error('Auth error:', authError);
        // Try to get API key directly
        const apiKey = typeof window !== 'undefined' ? localStorage.getItem('api_key') : null;
        if (apiKey) {
          headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          };
        } else {
          throw new Error('Authentication required');
        }
      }

      const response = await fetch(`/api/v1/products/${productId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const apiKey = localStorage.getItem('api_key') || process.env.NEXT_PUBLIC_TEST_API_KEY;
      
      const response = await fetch(`/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">{error || 'Product not found'}</p>
          <Link
            href="/dashboard/products"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header with breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/products" className="hover:text-gray-700 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
          
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">{product.name}</h1>
              {product.description && (
                <p className="text-gray-600 text-lg">{product.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                product.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${product.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                {product.active ? 'Active' : 'Inactive'}
              </span>
              <div className="text-right">
                <div className="text-2xl font-semibold text-gray-900">
                  {product.price_usd 
                    ? `$${product.price_usd.toFixed(2)}`
                    : `${formatSBTCAmount(product.price)} sBTC`
                  }
                </div>
                {product.price_usd && (
                  <div className="text-sm text-gray-500">
                    ≈ {formatSBTCAmount(product.price)} sBTC
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Images */}
          <div className="lg:col-span-1">
            {product.images && product.images.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>
                <div className="space-y-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No images</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{product.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Currency</dt>
                  <dd className="mt-1 text-sm text-gray-900 uppercase">{product.currency}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(product.created * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(product.updated * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Product ID</dt>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-900">
                      {product.id}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(product.id);
                        alert('Product ID copied!');
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded hover:border-gray-300 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Checkout URL</dt>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-900 truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/checkout/product/${product.id}` : ''}
                    </code>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/checkout/product/${product.id}`;
                        navigator.clipboard.writeText(url);
                        alert('URL copied!');
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded hover:border-gray-300 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {product.metadata && Object.keys(product.metadata).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                  <pre className="p-4 text-sm text-gray-800 overflow-auto max-h-64 font-mono">
                    {JSON.stringify(product.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/checkout/product/${product.id}`}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Checkout
                </Link>
                
                <button
                  onClick={() => setIsLinkGeneratorOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Generate Payment Link
                </button>
                
                <Link
                  href="/dashboard/products"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Products
                </Link>
              </div>
              
              {/* Danger Zone */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Danger Zone</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Permanently delete this product. This action cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Payment Link Generator Modal */}
        {product && (
          <PaymentLinkGenerator
            product={product}
            isOpen={isLinkGeneratorOpen}
            onClose={() => setIsLinkGeneratorOpen(false)}
          />
        )}
      </div>
    </div>
  );
}