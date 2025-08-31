'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import ProductList to avoid SSR issues
const ProductList = dynamic(
  () => import('@/components/products/product-list').then(mod => ({ default: mod.ProductList })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }
);

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      }>
        <ProductList />
      </Suspense>
    </div>
  );
}