'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [urlEmail, setUrlEmail] = useState<string | null>(null);
  const [urlMetadata, setUrlMetadata] = useState<Record<string, any> | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.productId);
    };
    getParams();

    // Parse URL parameters
    const email = searchParams.get('email');
    const metadataParam = searchParams.get('metadata');
    const linkCodeParam = searchParams.get('link_code');
    
    if (email) {
      setUrlEmail(email);
    }
    
    if (metadataParam) {
      try {
        const metadata = JSON.parse(metadataParam);
        setUrlMetadata(metadata);
      } catch (e) {
        console.error('Failed to parse metadata from URL:', e);
      }
    }
    
    if (linkCodeParam) {
      setLinkCode(linkCodeParam);
    }
  }, [params, searchParams]);

  useEffect(() => {
    if (productId) {
      fetchProductAndCreatePaymentIntent();
    }
  }, [productId]);

  const fetchProductAndCreatePaymentIntent = async () => {
    if (!productId) return;
    
    try {
      // Track payment link usage if link_code is present
      if (linkCode) {
        const trackResponse = await fetch('/api/v1/payment-links/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            link_code: linkCode,
            product_id: productId
          })
        });

        if (trackResponse.ok) {
          const trackData = await trackResponse.json();
          
          // If tracking found a payment link, merge its data
          if (trackData.tracked && trackData.email && !urlEmail) {
            setUrlEmail(trackData.email);
          }
          if (trackData.tracked && trackData.metadata) {
            setUrlMetadata(prev => ({ ...trackData.metadata, ...prev }));
          }
        } else {
          const errorData = await trackResponse.json();
          if (errorData.error?.type === 'expired_link' || errorData.error?.type === 'invalid_link') {
            setError(errorData.error.message);
            setLoading(false);
            return;
          }
        }
      }

      // First fetch the product (public endpoint)
      const productResponse = await fetch(`/api/v1/public/products/${productId}`);
      
      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();
      setProduct(productData);

      // Create a payment intent for this product
      const apiKey = process.env.NEXT_PUBLIC_TEST_API_KEY || 'test_key';
      
      // Merge URL metadata with default metadata
      const metadata = {
        product_id: productData.id,
        product_name: productData.name,
        ...(urlMetadata || {}),
        // Mark if this came from a generated link (has URL parameters)
        ...(urlEmail || urlMetadata ? {
          _generated_link: true,
          _generated_at: new Date().toISOString()
        } : {})
      };
      
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
          customer_email: urlEmail, // Include email if provided in URL
          metadata
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 mt-10 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">sBTC Pay</h1>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure payment
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Product Details - Left Side */}
          <div className="lg:col-span-7 mb-8 lg:mb-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Product Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                    {product.merchant_name && (
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732L9.464 6.5a2 2 0 112.072 0l1.732 1.732A2 2 0 0114 10v4H6v-4z" clipRule="evenodd" />
                          </svg>
                          {product.merchant_name}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-gray-900">
                      {product.price_usd 
                        ? `$${product.price_usd.toFixed(2)}`
                        : `${(product.price / 100_000_000).toFixed(8)} sBTC`
                      }
                    </div>
                    {product.price_usd && (
                      <div className="text-sm text-gray-500 mt-1">
                        ≈ {(product.price / 100_000_000).toFixed(8)} sBTC
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Image */}
              {product.images && product.images[0] && (
                <div className="px-6 py-4">
                  <div className="relative rounded-xl overflow-hidden bg-gray-50">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                          <div class="w-full h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                            <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Product Description */}
              {product.description && (
                <div className="px-6 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Features */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm">
                      <div className="font-medium text-green-900 mb-1">Secure sBTC Payment</div>
                      <div className="text-green-700">Powered by Bitcoin and Stacks blockchain technology</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form - Right Side */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  SSL secured
                </div>
              </div>
              
              <CheckoutForm 
                paymentIntentId={paymentIntentId} 
                initialEmail={urlEmail}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your payment information is encrypted and secure
            </div>
            <div className="text-xs text-gray-400">
              <div>Powered by sBTC Payment Gateway</div>
              <div className="mt-1">
                <a
                  href="https://servercompass.app/"
                  rel="dofollow"
                  target="_blank"
                  className="hover:text-gray-600 transition-colors"
                >
                  Deployed using <span className="text-blue-500 font-semibold">ServerCompass</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}