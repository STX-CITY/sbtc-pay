'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/products';
import { getAuthHeaders } from '@/lib/auth/client';

interface WidgetConfig {
  productId: string;
  theme: 'light' | 'dark' | 'branded';
  primaryColor: string;
  buttonText: string;
  buttonSize: 'small' | 'medium' | 'large';
  widgetType: 'button' | 'inline' | 'link';
  showAmount: boolean;
  showDescription: boolean;
  customAmount?: number;
}

export default function WidgetBuilderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WidgetConfig>({
    productId: '',
    theme: 'light',
    primaryColor: '#3B82F6',
    buttonText: 'Pay with sBTC',
    buttonSize: 'medium',
    widgetType: 'button',
    showAmount: true,
    showDescription: true,
  });
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/v1/products', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        
        // Set first product as default if available
        if (data.data && data.data.length > 0) {
          setConfig(prev => ({ ...prev, productId: data.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === config.productId);

  const generateWidgetCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';
    const selectedProd = products.find(p => p.id === config.productId);
    const amount = config.customAmount 
      ? Math.round(config.customAmount * 100_000_000) 
      : selectedProd?.price || 0;
    const description = selectedProd?.description || selectedProd?.name || 'Payment';
    
    if (config.widgetType === 'button') {
      return `<!-- sBTC Payment Widget -->
<script src="${baseUrl}/widget.js" 
        data-sbtc-key="pk_test_your_public_key_here"
        data-amount="${amount}"
        data-description="${description}"
        data-theme="${config.theme}"
        data-color="${config.primaryColor}"
        data-size="${config.buttonSize}"
        data-text="${config.buttonText}"
        ${config.showAmount ? 'data-show-amount="true"' : ''}
        ${config.showDescription ? 'data-show-description="true"' : ''}>
</script>`;
    }
    
    if (config.widgetType === 'inline') {
      return `<!-- sBTC Inline Widget -->
<div data-sbtc-widget
     data-sbtc-key="pk_test_your_public_key_here"
     data-amount="${amount}"
     data-description="${description}"
     data-theme="${config.theme}"
     data-color="${config.primaryColor}"
     data-type="inline"
     ${config.showAmount ? 'data-show-amount="true"' : ''}
     ${config.showDescription ? 'data-show-description="true"' : ''}>
</div>
<script src="${baseUrl}/widget.js"></script>`;
    }

    // Link widget
    return `<!-- sBTC Link Widget -->
<a href="#" 
   data-sbtc-link
   data-sbtc-key="pk_test_your_public_key_here"
   data-amount="${amount}"
   data-description="${description}"
   data-theme="${config.theme}"
   data-color="${config.primaryColor}"
   style="color: ${config.primaryColor}">
  ${config.buttonText}
</a>
<script src="${baseUrl}/widget.js"></script>`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateWidgetCode());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code');
    }
  };

  const WidgetPreview = () => {
    const buttonStyles = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    };

    const themeStyles = {
      light: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
      dark: 'bg-gray-900 border border-gray-700 text-white hover:bg-gray-800',
      branded: `text-white hover:opacity-90`
    };

    if (config.widgetType === 'link') {
      return (
        <a
          href="#"
          className="font-medium underline hover:no-underline"
          style={{ color: config.primaryColor }}
          onClick={(e) => e.preventDefault()}
        >
          {config.buttonText}
        </a>
      );
    }

    if (config.widgetType === 'inline') {
      return (
        <div className={`p-6 rounded-lg border ${config.theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className={`font-medium ${config.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedProduct.name}
                  </h3>
                  {config.showDescription && selectedProduct.description && (
                    <p className={`text-sm mt-1 ${config.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedProduct.description}
                    </p>
                  )}
                  {config.showAmount && (
                    <div className={`font-semibold mt-2 ${config.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {config.customAmount 
                        ? `$${config.customAmount.toFixed(2)}`
                        : selectedProduct.price_usd 
                          ? `$${selectedProduct.price_usd.toFixed(2)}`
                          : `${(selectedProduct.price / 100_000_000).toFixed(8)} sBTC`
                      }
                    </div>
                  )}
                </div>
              </div>
              <button
                className={`w-full ${buttonStyles[config.buttonSize]} rounded-lg font-medium transition-colors ${
                  config.theme === 'branded' ? '' : themeStyles[config.theme]
                }`}
                style={config.theme === 'branded' ? { backgroundColor: config.primaryColor } : {}}
              >
                {config.buttonText}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Button widget
    return (
      <button
        className={`${buttonStyles[config.buttonSize]} rounded-lg font-medium transition-colors ${
          config.theme === 'branded' ? '' : themeStyles[config.theme]
        }`}
        style={config.theme === 'branded' ? { backgroundColor: config.primaryColor } : {}}
      >
        {config.buttonText}
        {config.showAmount && selectedProduct && (
          <span className="ml-2">
            {config.customAmount 
              ? `- $${config.customAmount.toFixed(2)}`
              : selectedProduct.price_usd 
                ? `- $${selectedProduct.price_usd.toFixed(2)}`
                : `- ${(selectedProduct.price / 100_000_000).toFixed(8)} sBTC`
            }
          </span>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Widget Builder</h1>
        <p className="text-gray-600">
          Create drop-in payment widgets that your customers can add to any website with just a few lines of code.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Widget Configuration</h2>
            
            {/* Product Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={config.productId}
                  onChange={(e) => setConfig({...config, productId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price_usd ? `$${product.price_usd}` : `${(product.price / 100_000_000).toFixed(8)} sBTC`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Widget Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Widget Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['button', 'inline', 'link'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        value={type}
                        checked={config.widgetType === type}
                        onChange={(e) => setConfig({...config, widgetType: e.target.value as any})}
                        className="sr-only"
                      />
                      <div className={`w-full p-3 rounded-lg border-2 cursor-pointer text-center text-sm font-medium transition-colors ${
                        config.widgetType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'branded', label: 'Branded' }
                  ].map((theme) => (
                    <label key={theme.value} className="flex items-center">
                      <input
                        type="radio"
                        value={theme.value}
                        checked={config.theme === theme.value}
                        onChange={(e) => setConfig({...config, theme: e.target.value as any})}
                        className="sr-only"
                      />
                      <div className={`w-full p-3 rounded-lg border-2 cursor-pointer text-center text-sm font-medium transition-colors ${
                        config.theme === theme.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}>
                        {theme.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                <input
                  type="text"
                  value={config.buttonText}
                  onChange={(e) => setConfig({...config, buttonText: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Pay with sBTC"
                />
              </div>

              {/* Button Size */}
              {config.widgetType === 'button' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['small', 'medium', 'large'].map((size) => (
                      <label key={size} className="flex items-center">
                        <input
                          type="radio"
                          value={size}
                          checked={config.buttonSize === size}
                          onChange={(e) => setConfig({...config, buttonSize: e.target.value as any})}
                          className="sr-only"
                        />
                        <div className={`w-full p-3 rounded-lg border-2 cursor-pointer text-center text-sm font-medium transition-colors ${
                          config.buttonSize === size
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Display Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showAmount}
                      onChange={(e) => setConfig({...config, showAmount: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show amount</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showDescription}
                      onChange={(e) => setConfig({...config, showDescription: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show description</span>
                  </label>
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={!!config.customAmount}
                    onChange={(e) => setConfig({
                      ...config, 
                      customAmount: e.target.checked ? 10.00 : undefined
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Custom Amount (USD)</span>
                </label>
                {config.customAmount !== undefined && (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.customAmount}
                    onChange={(e) => setConfig({...config, customAmount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10.00"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Code Panel */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className={`p-6 rounded-lg ${config.theme === 'dark' ? 'bg-gray-100' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-center min-h-24">
                {selectedProduct ? (
                  <WidgetPreview />
                ) : (
                  <p className="text-gray-500 text-center">Select a product to see preview</p>
                )}
              </div>
            </div>
          </div>

          {/* Generated Code */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Code</h2>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  copiedCode
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100">
                <code>{generateWidgetCode()}</code>
              </pre>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Replace <code>pk_test_your_public_key_here</code> with your actual public API key from the{' '}
                <a href="/dashboard/developers/api-keys" className="text-yellow-900 underline hover:no-underline">
                  API Keys
                </a> page.
              </p>
            </div>
          </div>

          {/* Integration Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Instructions</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>1.</strong> Copy the generated code above
              </p>
              <p>
                <strong>2.</strong> Replace the placeholder API key with your public key
              </p>
              <p>
                <strong>3.</strong> Paste the code into your website's HTML
              </p>
              <p>
                <strong>4.</strong> The widget will automatically load and handle payments
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}