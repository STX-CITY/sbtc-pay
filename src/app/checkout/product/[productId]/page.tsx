'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/checkout-form';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  price_usd?: number;
  images?: string[];
  merchant_name?: string;
}

export default function ProductCheckoutPage({ 
  params 
}: { 
  params: Promise<{ productId: string }> 
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.productId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (productId) {
      fetchProductAndCreatePaymentIntent();
    }
  }, [productId]);

  const fetchProductAndCreatePaymentIntent = async () => {
    if (!productId) return;
    
    try {
      // First fetch the product (public endpoint)
      const productResponse = await fetch(`/api/v1/public/products/${productId}`);
      
      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();
      setProduct(productData);

      // Create a payment intent for this product
      const apiKey = process.env.NEXT_PUBLIC_TEST_API_KEY || 'test_key';
      
      const paymentIntentResponse = await fetch('/api/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          product: {
            id: productData.id,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            price_usd: productData.price_usd,
            images: productData.images,
            merchantId: productData.merchantId // merchantId should come from product data
          },
          description: `Purchase: ${productData.name}`,
          metadata: {
            product_id: productData.id,
            product_name: productData.name
          }
        })
      });

      if (!paymentIntentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntent = await paymentIntentResponse.json();
      setPaymentIntentId(paymentIntent.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product || !paymentIntentId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Product Info */}
            <div className="md:w-1/2 p-8 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
              {product.merchant_name && (
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    <span className="mr-1">🏪</span>
                    {product.merchant_name}
                  </div>
                </div>
              )}
              
              {product.images && product.images[0] && (
                <div className="mb-4">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {product.price_usd 
                      ? `$${product.price_usd.toFixed(2)}`
                      : `${(product.price / 100_000_000).toFixed(8)} sBTC`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="md:w-1/2 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Purchase</h3>
              <CheckoutForm paymentIntentId={paymentIntentId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}