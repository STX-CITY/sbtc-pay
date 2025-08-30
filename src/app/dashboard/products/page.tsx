'use client';

import { ProductList } from '@/components/products/product-list';
import { ErrorBoundary } from '@/components/error-boundary';

export default function ProductsPage() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ProductsPage Error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <ProductList />
      </div>
    </ErrorBoundary>
  );
}