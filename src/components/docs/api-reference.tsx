'use client';

import { useState } from 'react';

export function ApiReference() {
  const [apiKey, setApiKey] = useState('');
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [endpointResponses, setEndpointResponses] = useState<{[key: string]: any}>({});
  const [endpointErrors, setEndpointErrors] = useState<{[key: string]: string}>({});
  const [copiedResponse, setCopiedResponse] = useState<string | null>(null);
  const [pathParams, setPathParams] = useState<{[key: string]: string}>({});
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    product_id: '',
    product_name: '',
    email: '',
    metadata: [{ key: '', value: '' }],
    expires_at: ''
  });

  const copyToClipboard = async (text: string, endpointKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedResponse(endpointKey);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedResponse(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getPathParams = (endpoint: string): string[] => {
    const matches = endpoint.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const buildEndpointUrl = (endpoint: string, endpointKey: string): string => {
    let url = endpoint;
    const params = getPathParams(endpoint);
    
    params.forEach(param => {
      const value = pathParams[`${endpointKey}-${param}`] || `{${param}}`;
      url = url.replace(`{${param}}`, value);
    });
    
    return url;
  };

  const addMetadataField = () => {
    setPaymentLinkForm(prev => ({
      ...prev,
      metadata: [...prev.metadata, { key: '', value: '' }]
    }));
  };

  const removeMetadataField = (index: number) => {
    setPaymentLinkForm(prev => ({
      ...prev,
      metadata: prev.metadata.filter((_, i) => i !== index)
    }));
  };

  const updateMetadataField = (index: number, field: 'key' | 'value', value: string) => {
    setPaymentLinkForm(prev => ({
      ...prev,
      metadata: prev.metadata.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const buildPaymentLinkData = () => {
    const validMetadata = paymentLinkForm.metadata
      .filter(item => item.key.trim() && item.value.trim())
      .reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});

    const data: any = {
      product_id: paymentLinkForm.product_id,
      product_name: paymentLinkForm.product_name,
      generated_url: `${window.location.origin}/checkout/product/${paymentLinkForm.product_id}`
    };

    if (paymentLinkForm.email) {
      data.email = paymentLinkForm.email;
    }

    if (Object.keys(validMetadata).length > 0) {
      data.metadata = validMetadata;
    }

    if (paymentLinkForm.expires_at) {
      data.expires_at = paymentLinkForm.expires_at;
    }

    return data;
  };

  const testApiEndpoint = async (endpoint: string, method: string, sampleData?: any) => {
    const endpointKey = `${method} ${endpoint}`;
    const actualEndpoint = buildEndpointUrl(endpoint, endpointKey);
    
    // Check if endpoint still has unfilled parameters
    if (actualEndpoint.includes('{') && actualEndpoint.includes('}')) {
      setEndpointErrors(prev => ({ 
        ...prev, 
        [endpointKey]: 'Please fill in all required path parameters' 
      }));
      return;
    }
    
    setTestingApi(endpointKey);
    setEndpointErrors(prev => ({ ...prev, [endpointKey]: '' }));

    if (!apiKey.trim()) {
      setEndpointErrors(prev => ({ 
        ...prev, 
        [endpointKey]: 'Please enter your API key first' 
      }));
      setTestingApi(null);
      return;
    }

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      if (sampleData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        // Special handling for payment-links endpoint
        if (endpoint === '/payment-links' && method === 'POST') {
          options.body = JSON.stringify(buildPaymentLinkData());
        } else {
          options.body = JSON.stringify(sampleData);
        }
      }

      const response = await fetch(`/api/v1${actualEndpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        setEndpointErrors(prev => ({ 
          ...prev, 
          [endpointKey]: data.error?.message || `HTTP ${response.status}: ${response.statusText}`
        }));
      } else {
        setEndpointResponses(prev => ({ ...prev, [endpointKey]: data }));
      }
    } catch (error) {
      setEndpointErrors(prev => ({ 
        ...prev, 
        [endpointKey]: error instanceof Error ? error.message : 'Network error occurred'
      }));
    } finally {
      setTestingApi(null);
    }
  };

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/products',
      title: 'Create Product',
      description: 'Create a new product for sale',
      sampleData: {
        name: "Premium Plan",
        description: "Monthly subscription",
        price_usd: 29.99,
        type: "subscription"
      }
    },
    {
      method: 'GET',
      endpoint: '/products',
      title: 'List Products',
      description: 'Retrieve all your products',
      queryParams: [
        { name: 'limit', description: 'Number of products to return (max 100)', example: '10' },
        { name: 'offset', description: 'Number of products to skip', example: '0' },
        { name: 'active', description: 'Filter by active status', example: 'true' }
      ]
    },
    {
      method: 'GET',
      endpoint: '/products/{id}',
      title: 'Retrieve Product',
      description: 'Get details of a specific product by its ID'
    },
    {
      method: 'POST',
      endpoint: '/products/{id}',
      title: 'Update Product',
      description: 'Update an existing product by its ID',
      sampleData: {
        name: "Updated Premium Plan",
        price_usd: 39.99,
        active: true
      }
    },
    {
      method: 'DELETE',
      endpoint: '/products/{id}',
      title: 'Delete Product',
      description: 'Permanently delete a product by its ID'
    },
    {
      method: 'POST',
      endpoint: '/payment_intents',
      title: 'Create Payment Intent',
      description: 'Create a payment intent for a customer',
      sampleData: {
        amount: 1000000,
        currency: "sbtc",
        description: "Test payment"
      }
    },
    {
      method: 'GET',
      endpoint: '/payment_intents',
      title: 'List Payment Intents',
      description: 'Retrieve all payment intents',
      queryParams: [
        { name: 'limit', description: 'Number of payment intents to return (max 100)', example: '10' },
        { name: 'status', description: 'Filter by status', example: 'succeeded' }
      ]
    },
    {
      method: 'GET',
      endpoint: '/payment_intents/{id}',
      title: 'Retrieve Payment Intent',
      description: 'Get details of a specific payment intent by its ID'
    },
    {
      method: 'GET',
      endpoint: '/customers',
      title: 'List Customers',
      description: 'Retrieve all customers with successful payments',
      queryParams: [
        { name: 'limit', description: 'Number of customers to return (max 100)', example: '10' },
        { name: 'offset', description: 'Number of customers to skip', example: '0' }
      ]
    },
    {
      method: 'GET',
      endpoint: '/customers/{identifier}',
      title: 'Retrieve Customer',
      description: 'Get detailed information about a specific customer by address or email, including all transactions and purchased products'
    },
    {
      method: 'POST',
      endpoint: '/payment-links',
      title: 'Create Payment Link',
      description: 'Generate a payment link for a specific product with optional customization',
      sampleData: {
        product_id: "prod_1234567890",
        product_name: "Premium Plan",
        email: "customer@example.com",
        metadata: {
          campaign: "summer_sale",
          source: "website"
        },
        generated_url: "https://yoursite.com/checkout/product/prod_1234567890",
        expires_at: "2024-12-31T23:59:59Z"
      }
    },
    {
      method: 'GET',
      endpoint: '/payment-links',
      title: 'List Payment Links',
      description: 'Retrieve all your generated payment links',
      queryParams: [
        { name: 'limit', description: 'Number of payment links to return (max 100)', example: '10' },
        { name: 'offset', description: 'Number of payment links to skip', example: '0' },
        { name: 'active', description: 'Filter by active status', example: 'true' }
      ]
    },
    {
      method: 'GET',
      endpoint: '/payment-links/{id}',
      title: 'Retrieve Payment Link',
      description: 'Get details of a specific payment link by its ID'
    },
    {
      method: 'PATCH',
      endpoint: '/payment-links/{id}',
      title: 'Update Payment Link',
      description: 'Update a payment link\'s status or expiration date',
      sampleData: {
        is_active: false,
        expires_at: "2024-06-30T23:59:59Z"
      }
    },
    {
      method: 'DELETE',
      endpoint: '/payment-links/{id}',
      title: 'Delete Payment Link',
      description: 'Permanently delete a payment link by its ID'
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">API Reference</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Base URL</h3>
            <div className="bg-gray-100 rounded p-3">
              <code className="text-sm">https://sbtcpay.org/api/v1</code>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Authentication</h3>
            <p className="text-gray-600 mb-3">Include your API key in the Authorization header:</p>
            <div className="bg-gray-900 rounded p-3">
              <code className="text-green-400 text-sm">Authorization: Bearer sk_test_....</code>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Test API Endpoints</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Enter your API key to test endpoints:</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_test_your_api_key_here"
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
            <p className="text-purple-100 text-xs mt-2">Enter your API key above, then click "Try It" on any endpoint below to test it.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {apiEndpoints.map((api, index) => {
          const endpointKey = `${api.method} ${api.endpoint}`;
          const isLoading = testingApi === endpointKey;
          const response = endpointResponses[endpointKey];
          const error = endpointErrors[endpointKey];
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      api.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      api.method === 'POST' ? 'bg-green-100 text-green-800' :
                      api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      api.method === 'PATCH' ? 'bg-orange-100 text-orange-800' :
                      api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {api.method}
                    </span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{api.endpoint}</code>
                  </div>
                  <button
                    onClick={() => testApiEndpoint(api.endpoint, api.method, api.sampleData)}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isLoading ? 'Testing...' : 'Try It'}
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{api.title}</h3>
                <p className="text-gray-600 mb-4">{api.description}</p>
                
                {getPathParams(api.endpoint).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Path Parameters:</h4>
                    <div className="space-y-3">
                      {getPathParams(api.endpoint).map((param, paramIndex) => (
                        <div key={paramIndex} className="flex items-start space-x-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{param}</code>
                              <span className="text-xs text-red-500">required</span>
                            </div>
                            <input
                              type="text"
                              placeholder={
                                param === 'identifier' ? 'ST123... or customer@example.com' :
                                param === 'id' && api.endpoint.includes('products') ? 'prod_1234567890' :
                                param === 'id' && api.endpoint.includes('payment_intents') ? 'pi_1234567890' :
                                param === 'id' && api.endpoint.includes('payment-links') ? 'link_abcd1234efgh5678' :
                                param === 'id' ? 'Enter ID' :
                                `Enter ${param}`
                              }
                              value={pathParams[`${endpointKey}-${param}`] || ''}
                              onChange={(e) => setPathParams(prev => ({
                                ...prev,
                                [`${endpointKey}-${param}`]: e.target.value
                              }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {param === 'identifier' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Can be either a Stacks address (ST123...) or email address
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {api.queryParams && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Query Parameters:</h4>
                    <div className="space-y-2">
                      {api.queryParams.map((param, paramIndex) => (
                        <div key={paramIndex} className="flex items-start space-x-2 text-sm">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{param.name}</code>
                          <span className="text-gray-600">{param.description}</span>
                          {param.example && (
                            <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">e.g. {param.example}</code>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Special interactive form for Create Payment Link */}
                {api.endpoint === '/payment-links' && api.method === 'POST' && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Request Parameters:</h4>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      {/* Product ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={paymentLinkForm.product_id}
                          onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, product_id: e.target.value }))}
                          placeholder="prod_1234567890"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">The ID of the product to create a payment link for</p>
                      </div>

                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={paymentLinkForm.product_name}
                          onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, product_name: e.target.value }))}
                          placeholder="Premium Plan"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Display name for the product</p>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Email <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="email"
                          value={paymentLinkForm.email}
                          onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="customer@example.com"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Pre-fill customer email in the checkout form</p>
                      </div>

                      {/* Metadata */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Metadata <span className="text-gray-400">(optional)</span>
                          </label>
                          <button
                            onClick={addMetadataField}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            type="button"
                          >
                            + Add Field
                          </button>
                        </div>
                        <div className="space-y-2">
                          {paymentLinkForm.metadata.map((field, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) => updateMetadataField(index, 'key', e.target.value)}
                                placeholder="Key"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => updateMetadataField(index, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {paymentLinkForm.metadata.length > 1 && (
                                <button
                                  onClick={() => removeMetadataField(index)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  type="button"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Custom key-value pairs for tracking</p>
                      </div>

                      {/* Expires At */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expires At <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={paymentLinkForm.expires_at}
                          onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, expires_at: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">When the payment link should expire</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show generated request body for payment links */}
                {api.endpoint === '/payment-links' && api.method === 'POST' && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Request Body:</h4>
                    <div className="bg-gray-900 rounded p-3">
                      <pre className="text-green-400 text-xs overflow-x-auto">
                        {JSON.stringify(buildPaymentLinkData(), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {api.sampleData && !(api.endpoint === '/payment-links' && api.method === 'POST') && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Request Body:</h4>
                    <div className="bg-gray-900 rounded p-3">
                      <pre className="text-green-400 text-xs overflow-x-auto">
                        {JSON.stringify(api.sampleData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {(response || error) && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {error ? 'Error Response:' : 'Response:'}
                      </h4>
                      {!error && response && (
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(response, null, 2), endpointKey)}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            copiedResponse === endpointKey
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {copiedResponse === endpointKey ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                      {error && (
                        <button
                          onClick={() => copyToClipboard(error, `${endpointKey}-error`)}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            copiedResponse === `${endpointKey}-error`
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {copiedResponse === `${endpointKey}-error` ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    {error ? (
                      <div className="bg-red-50 border border-red-200 rounded p-3 relative">
                        <pre className="text-red-700 text-xs whitespace-pre-wrap overflow-x-auto">
                          {error}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-gray-900 rounded p-3 relative">
                        <pre className="text-green-400 text-xs overflow-x-auto">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}