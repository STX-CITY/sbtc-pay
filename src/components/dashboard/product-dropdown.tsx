'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/auth/client';
import { Product } from '@/types/products';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';

interface ProductDropdownProps {
  selectedProduct?: Product | null;
  onProductSelect: (product: Product | null) => void;
  placeholder?: string;
  className?: string;
}

export function ProductDropdown({ 
  selectedProduct, 
  onProductSelect, 
  placeholder = "Select a product...",
  className = ""
}: ProductDropdownProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/v1/products?limit=50&active=true', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="w-full p-3 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          {selectedProduct ? (
            <div className="flex items-center space-x-3">
              {selectedProduct.images?.[0] && (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-8 h-8 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedProduct.price_usd 
                    ? `$${selectedProduct.price_usd.toFixed(2)}`
                    : `${formatSBTCAmount(selectedProduct.price)} sBTC`
                  }
                </p>
              </div>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {products.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              No active products found
            </div>
          ) : (
            <ul className="py-1" role="listbox">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="w-full p-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleProductSelect(product)}
                    role="option"
                    aria-selected={selectedProduct?.id === product.id}
                  >
                    <div className="flex items-center space-x-3">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 truncate">{product.description}</p>
                        )}
                        <p className="text-sm font-medium text-gray-700">
                          {product.price_usd 
                            ? `$${product.price_usd.toFixed(2)}`
                            : `${formatSBTCAmount(product.price)} sBTC`
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}