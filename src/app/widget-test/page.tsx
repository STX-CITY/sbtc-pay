'use client';

import { useEffect, useState } from 'react';

export default function WidgetTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Test widget loading
    const testWidget = async () => {
      addResult('Starting widget tests...');
      
      try {
        // Test 1: Check if widget.js is accessible
        const response = await fetch('/widget.js');
        if (response.ok) {
          addResult('✅ Widget.js file is accessible');
        } else {
          addResult('❌ Widget.js file not found');
        }

        // Test 2: Check widget configuration API
        const configResponse = await fetch('/api/v1/widgets/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: 'pk_test_demo123456789',
            widgetType: 'button',
            amount: 100000,
            description: 'Test payment'
          })
        });

        if (configResponse.ok) {
          const configData = await configResponse.json();
          addResult('✅ Widget configuration API working');
          addResult(`   - Merchant found: ${configData.success}`);
          addResult(`   - Embed URL: ${configData.embedUrl}`);
        } else {
          addResult('❌ Widget configuration API failed');
          const errorData = await configResponse.json();
          addResult(`   - Error: ${errorData.error}`);
        }

        // Test 3: Check widget CSS
        const cssResponse = await fetch('/widget.css');
        if (cssResponse.ok) {
          addResult('✅ Widget CSS file is accessible');
        } else {
          addResult('❌ Widget CSS file not found');
        }

        // Test 4: Check embed checkout page
        const embedResponse = await fetch('/embed/checkout');
        if (embedResponse.ok) {
          addResult('✅ Embed checkout page is accessible');
        } else {
          addResult('❌ Embed checkout page not accessible');
        }

        addResult('Widget tests completed!');
        
      } catch (error) {
        addResult(`❌ Test error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    testWidget();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Widget Test Suite</h1>
            <p className="mt-2 text-gray-600">
              Testing the sBTC payment widget functionality and API endpoints.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Test Results */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                  {isLoading && (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400 mr-2"></div>
                      Running tests...
                    </div>
                  )}
                  {testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Widget Tests */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Widget Tests</h2>
                
                <div className="space-y-6">
                  {/* Button Widget Test */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Button Widget</h3>
                    <div 
                      data-sbtc-button
                      data-amount="50000"
                      data-description="Test Button Payment"
                      data-button-text="Pay with sBTC"
                    ></div>
                    <code className="text-xs text-gray-500 mt-2 block">
                      data-sbtc-button data-amount="50000"
                    </code>
                  </div>

                  {/* Inline Widget Test */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Inline Widget</h3>
                    <div 
                      data-sbtc-inline
                      data-amount="125000"
                      data-description="Test Inline Payment"
                      data-button-text="Complete Payment"
                    ></div>
                    <code className="text-xs text-gray-500 mt-2 block">
                      data-sbtc-inline data-amount="125000"
                    </code>
                  </div>

                  {/* Link Widget Test */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Link Widget</h3>
                    <p className="text-gray-700">
                      Click{' '}
                      <span
                        data-sbtc-link
                        data-amount="25000"
                        data-description="Test Link Payment"
                      >
                        this link
                      </span>
                      {' '}to test the link widget.
                    </p>
                    <code className="text-xs text-gray-500 mt-2 block">
                      data-sbtc-link data-amount="25000"
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Test Instructions */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Testing Instructions</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Click any of the widget elements above to trigger the payment modal</li>
                  <li>Verify that the modal opens with the correct payment details</li>
                  <li>Check that the embed checkout iframe loads properly</li>
                  <li>Test the modal close functionality</li>
                  <li>Try different widget themes and configurations</li>
                  <li>Test responsiveness on different screen sizes</li>
                </ol>
              </div>
            </div>

            {/* Integration Code Examples */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Examples</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Basic Setup</h3>
                  <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
{`<script src="/widget.js" 
        data-sbtc-key="pk_test_...">
</script>

<div data-sbtc-button
     data-amount="100000"
     data-description="Product">
</div>`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">With Custom Styling</h3>
                  <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
{`<div data-sbtc-inline
     data-amount="250000"
     data-description="Premium Plan"
     data-theme="blue"
     data-button-text="Subscribe">
</div>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Script */}
      <script 
        src="/widget.js" 
        data-sbtc-key="pk_test_demo123456789"
      ></script>
    </div>
  );
}