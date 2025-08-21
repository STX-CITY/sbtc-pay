'use client';

import { useState } from 'react';
import { getAuthHeaders } from '@/lib/auth/client';

interface WebhookTest {
  url: string;
  events: string[];
  description?: string;
}

export function WebhookTester() {
  const [testUrl, setTestUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['payment_intent.succeeded']);
  const [testDescription, setTestDescription] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const AVAILABLE_EVENTS = [
    'payment_intent.created',
    'payment_intent.succeeded', 
    'payment_intent.failed',
    'payment_intent.canceled',
    'product.created',
    'product.updated',
    'product.deleted',
    'merchant.updated'
  ];

  const useTestWebhookUrl = () => {
    const testUrl = `${window.location.origin}/api/test_webhook`;
    setTestUrl(testUrl);
    setTestDescription('Test webhook endpoint for development');
  };

  const runWebhookTest = async () => {
    if (!testUrl || selectedEvents.length === 0) {
      addTestResult('❌ Please provide a webhook URL and select at least one event');
      return;
    }

    setTesting(true);
    addTestResult(`🚀 Starting webhook test for: ${testUrl}`);

    try {
      // First, create a temporary webhook endpoint
      const createResponse = await fetch('/api/v1/webhook-endpoints', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: testUrl,
          description: testDescription || 'Test webhook endpoint',
          events: selectedEvents,
          active: true
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create test webhook: ${createResponse.statusText}`);
      }

      const webhook = await createResponse.json();
      addTestResult(`✅ Created test webhook endpoint: ${webhook.id}`);
      addTestResult(`🔑 Webhook secret: ${webhook.secret}`);

      // Test each selected event
      for (const eventType of selectedEvents) {
        addTestResult(`📤 Testing event: ${eventType}`);
        
        try {
          const testResponse = await fetch(`/api/v1/webhook-endpoints/${webhook.id}/test`, {
            method: 'POST',
            headers: getAuthHeaders()
          });

          if (testResponse.ok) {
            addTestResult(`✅ ${eventType} - Test webhook sent successfully`);
          } else {
            addTestResult(`❌ ${eventType} - Test failed: ${testResponse.statusText}`);
          }
        } catch (err) {
          addTestResult(`❌ ${eventType} - Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clean up: delete the test webhook endpoint
      try {
        await fetch(`/api/v1/webhook-endpoints/${webhook.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        addTestResult(`🧹 Cleaned up test webhook endpoint`);
      } catch (err) {
        addTestResult(`⚠️ Warning: Could not clean up test webhook endpoint`);
      }

      addTestResult(`🎉 Webhook test completed!`);
    } catch (error) {
      addTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleEventToggle = (eventType: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Webhook Tester</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL to Test
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://your-app.com/webhooks"
                className="flex-1 p-2 border rounded text-sm"
              />
              <button
                onClick={useTestWebhookUrl}
                className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Use Test URL
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              placeholder="Test webhook for development"
              className="w-full p-2 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Test
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((eventType) => (
                <label key={eventType} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(eventType)}
                    onChange={() => handleEventToggle(eventType)}
                    className="rounded"
                  />
                  <span className="text-sm">{eventType}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runWebhookTest}
              disabled={!testUrl || selectedEvents.length === 0 || testing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Run Test'}
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Clear Results
            </button>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Test Results</h3>
            <div className="bg-gray-900 rounded p-3 h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-green-400 text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}