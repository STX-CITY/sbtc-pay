'use client';

import { useState, useEffect, use } from 'react';
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

export default function ProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinkGeneratorOpen, setIsLinkGeneratorOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    debugger;
    try {
      const response = await fetch(`/api/v1/products/${resolvedParams.id}`, {
        headers: getAuthHeaders()
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
      
      const response = await fetch(`/api/v1/products/${resolvedParams.id}`, {
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
     <p>This is test</p>
    </div>
  );
}