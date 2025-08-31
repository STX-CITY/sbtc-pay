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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                product.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {product.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Images */}
          {product.images && product.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Product Images</h3>
              <div className="flex space-x-4 overflow-x-auto">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-32 w-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Description</h3>
              <p className="mt-1 text-gray-900">{product.description || 'No description'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Price</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {product.price_usd 
                  ? `$${product.price_usd.toFixed(2)}`
                  : `${formatSBTCAmount(product.price)} sBTC`
                }
              </p>
              {product.price_usd && (
                <p className="text-sm text-gray-500">
                  ≈ {formatSBTCAmount(product.price)} sBTC
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Type</h3>
              <p className="mt-1 text-gray-900 capitalize">{product.type}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Product ID</h3>
              <p className="mt-1 text-gray-900 font-mono text-sm">{product.id}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Created</h3>
              <p className="mt-1 text-gray-900">
                {new Date(product.created * 1000).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Last Updated</h3>
              <p className="mt-1 text-gray-900">
                {new Date(product.updated * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Metadata */}
          {product.metadata && Object.keys(product.metadata).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(product.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/checkout/product/${product.id}`}
              target="_blank"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Preview Checkout
            </Link>
            <button
              onClick={() => setIsLinkGeneratorOpen(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Generate Payment Link
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/checkout/product/${product.id}`;
                navigator.clipboard.writeText(url);
                alert('Checkout URL copied to clipboard!');
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Copy Checkout URL
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Product
            </button>
            <Link
              href="/dashboard/products"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back to Products
            </Link>
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
  );
}