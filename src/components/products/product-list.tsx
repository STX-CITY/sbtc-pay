'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';
import { getAuthHeaders } from '@/lib/auth/client';

interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  price_usd?: number;
  currency: string;
  images?: string[];
  active: boolean;
  created: number;
  updated: number;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/v1/products?limit=20', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const apiKey = localStorage.getItem('api_key') || process.env.NEXT_PUBLIC_TEST_API_KEY;
      
      const response = await fetch(`/api/v1/products/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          active: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Refresh the list
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
    }
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
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500 mb-4">Create your first product to start accepting payments</p>
        <Link
          href="/dashboard/products/new"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link
          href="/dashboard/products/new"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Product
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        <Link href={`/dashboard/products/${product.id}`}>
                          {product.name}
                        </Link>
                      </p>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:space-x-4">
                        <p className="text-sm text-gray-500">
                          {product.description || 'No description'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="font-medium">
                          {product.price_usd 
                            ? `$${product.price_usd.toFixed(2)} USD`
                            : `${formatSBTCAmount(product.price)} sBTC`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        ID: {product.id}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.active)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {product.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link
                          href={`/checkout/product/${product.id}`}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          Preview Checkout
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}