'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

interface ProductPageWrapperProps {
  children: ReactNode;
  pageName?: string;
}

export function ProductPageWrapper({ children, pageName = 'Product' }: ProductPageWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`${pageName} Page Error:`, error);
        console.error('Component Stack:', errorInfo.componentStack);
        
        // Log additional context in production
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          console.error('Production Error Context:', {
            page: pageName,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            error: {
              message: error.message,
              stack: error.stack
            }
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}