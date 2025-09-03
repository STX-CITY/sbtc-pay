'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/products';
import { getAuthHeaders } from '@/lib/auth/client';

export default function EmbeddedCheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [publicApiKey, setPublicApiKey] = useState<string>('');
  const [customization, setCustomization] = useState({
    width: '400px',
    height: '600px',
    theme: 'light',
    borderRadius: '8px',
    primaryColor: '#3B82F6'
  });
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchPublicApiKey();
  }, []);

  const fetchPublicApiKey = async () => {
    try {
      const response = await fetch('/api/v1/merchants/profile', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPublicApiKey(data.publicApiKeyTest || 'pk_test_YOUR_PUBLIC_KEY');
      }
    } catch (error) {
      console.error('Error fetching public API key:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/v1/products', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData); // Debug log
        setProducts(responseData.data || []);
      } else {
        console.error('Failed to fetch products:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedCode = () => {
    if (!selectedProduct) return;

    const embedCode = `<!-- sBTC Pay Embedded Checkout -->
<div id="sbtc-checkout-${selectedProduct.id}"></div>
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${window.location.origin}/embed/checkout.js';
  script.onload = function() {
    SBTCPay.createCheckout({
      containerId: 'sbtc-checkout-${selectedProduct.id}',
      productId: '${selectedProduct.id}',
      apiKey: '${publicApiKey}', // Your public API key
      style: {
        width: '${customization.width}',
        height: '${customization.height}',
        borderRadius: '${customization.borderRadius}',
        primaryColor: '${customization.primaryColor}',
        theme: '${customization.theme}'
      },
      onSuccess: function(paymentIntent) {
        console.log('Payment successful:', paymentIntent);
        // Handle successful payment
      },
      onError: function(error) {
        console.error('Payment error:', error);
        // Handle payment error
      },
      onCancel: function() {
        console.log('Payment cancelled');
        // Handle payment cancellation
      }
    });
  };
  document.head.appendChild(script);
})();
</script>`;

    setGeneratedCode(embedCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 3000);
  };

  const generateCompleteHTML = () => {
    if (!selectedProduct) return '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>sBTC Pay Embedded Checkout - ${selectedProduct.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            padding: 32px;
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .header h1 {
            color: #1f2937;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        .header p {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .checkout-container {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
        }
        .info {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 16px;
            margin-top: 24px;
        }
        .info p {
            color: #0c4a6e;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>sBTC Pay Embedded Checkout</h1>
            <p>Product: <strong>${selectedProduct.name}</strong></p>
            ${selectedProduct.price_usd ? 
              `<p>Price: <strong>$${selectedProduct.price_usd.toFixed(2)} USD</strong></p>` : 
              `<p>Price: <strong>${(selectedProduct.price / 100_000_000).toFixed(8)} sBTC</strong></p>`
            }
        </div>
        
        <div class="checkout-container">
            ${generatedCode}
        </div>
        
        <div class="info">
            <p><strong>Note:</strong> This is a test integration. The embedded checkout will load the sBTC Pay interface for the selected product.</p>
        </div>
    </div>
</body>
</html>`;
  };

  const downloadHTML = () => {
    if (!selectedProduct) return;
    
    const htmlContent = generateCompleteHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sbtc-pay-checkout-${selectedProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Success Alert */}
      {showCopyAlert && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Code copied to clipboard!</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Embedded Checkout</h1>
        <p className="text-gray-600">
          Generate embeddable checkout forms for your website. Customers can pay directly on your site without redirects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
            
            {/* Product Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product
                </label>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
                ) : (
                  <>
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        setSelectedProduct(product || null);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.price_usd ? `$${product.price_usd}` : `${(product.price / 100000000).toFixed(8)} sBTC`}
                        </option>
                      ))}
                    </select>
                    {!loading && products.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        No products found. <a href="/dashboard/products" className="text-blue-600 hover:underline">Create a product first</a>.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Customization Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                  <input
                    type="text"
                    value={customization.width}
                    onChange={(e) => setCustomization({...customization, width: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="400px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={customization.height}
                    onChange={(e) => setCustomization({...customization, height: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="600px"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={customization.theme}
                    onChange={(e) => setCustomization({...customization, theme: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                  <input
                    type="text"
                    value={customization.borderRadius}
                    onChange={(e) => setCustomization({...customization, borderRadius: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8px"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                    className="w-12 h-10 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <button
                onClick={generateEmbedCode}
                disabled={!selectedProduct}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Generate Embed Code
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No redirect - customers stay on your site
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Customizable appearance and styling
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time payment status updates
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mobile responsive design
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Event callbacks for success/error handling
              </li>
            </ul>
          </div>
        </div>

        {/* Code Preview */}
        <div className="space-y-6">
          {/* Preview */}
          {selectedProduct && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div 
                  className="mx-auto bg-white border border-gray-200 rounded-lg shadow-sm"
                  style={{ 
                    width: customization.width,
                    height: customization.height,
                    maxWidth: '100%',
                    borderRadius: customization.borderRadius,
                    backgroundColor: customization.theme === 'dark' ? '#1F2937' : '#FFFFFF'
                  }}
                >
                  <div className="p-6 h-full flex flex-col">
                    <div className="text-center mb-4">
                      <h4 className={`text-lg font-semibold ${customization.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProduct.name}
                      </h4>
                      <p className="text-2xl font-bold mt-2" style={{ color: customization.primaryColor }}>
                        {selectedProduct.price_usd ? `$${selectedProduct.price_usd}` : `${selectedProduct.price} sBTC`}
                      </p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center">
                      <div className={`text-center ${customization.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p>Checkout Form Preview</p>
                        <p className="text-sm">Interactive form will appear here</p>
                      </div>
                    </div>
                    
                    <button 
                      className="w-full py-3 rounded-lg font-medium text-white"
                      style={{ backgroundColor: customization.primaryColor }}
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Code */}
          {generatedCode && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
                <div className="flex gap-3">
                  <button
                    onClick={downloadHTML}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                  >
                    Download HTML
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-lg transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Your Test Public API Key:</strong> <code className="bg-white px-2 py-1 rounded">{publicApiKey}</code>
                </p>
                <p className="text-sm text-yellow-700 mb-2">
                  This is your public test API key. It's safe to use in client-side code.
                </p>
                <p className="text-sm text-yellow-700">
                  The embed script will automatically load the sBTC Pay checkout interface into the specified container. For production, use your live public key from the 
                  <span className="ml-1">
                    <a href="/dashboard/developers/api-keys" className="text-blue-600 hover:underline">API Keys</a>
                  </span> page.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}