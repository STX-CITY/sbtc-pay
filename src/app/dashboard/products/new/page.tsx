'use client';

import dynamic from 'next/dynamic';

// Dynamically import ProductFormSafe with no SSR
const ProductFormSafe = dynamic(
  () => import('@/components/products/product-form-safe').then(mod => ({ default: mod.ProductFormSafe })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
);

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <ProductFormSafe />
      </div>
    </div>
  );
}