'use client';

import { ProductForm } from '@/components/products/product-form';
import { ErrorBoundary } from '@/components/error-boundary';

export default function NewProductPage() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('NewProductPage Error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <ProductForm />
        </div>
      </div>
    </ErrorBoundary>
  );
}