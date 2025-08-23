'use client';

import { useState } from 'react';

export function ApiReference() {
  const [apiKey, setApiKey] = useState('');
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [endpointResponses, setEndpointResponses] = useState<{[key: string]: any}>({});
  const [endpointErrors, setEndpointErrors] = useState<{[key: string]: string}>({});
  const [copiedResponse, setCopiedResponse] = useState<string | null>(null);
  const [pathParams, setPathParams] = useState<{[key: string]: string}>({});

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

      if (sampleData && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(sampleData);
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
                
                {api.sampleData && (
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