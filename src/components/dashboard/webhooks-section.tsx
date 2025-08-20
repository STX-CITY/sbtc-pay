'use client';

import { useState } from 'react';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  lastDelivery?: string;
}

export function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([
    {
      id: 'we_123abc',
      url: 'https://example.com/webhooks/sbtc',
      events: ['payment_intent.succeeded', 'payment_intent.failed'],
      status: 'active',
      lastDelivery: '2024-01-15T10:30:00Z'
    }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const addWebhook = () => {
    if (!newWebhookUrl) return;
    
    const newWebhook: WebhookEndpoint = {
      id: `we_${Math.random().toString(36).substr(2, 9)}`,
      url: newWebhookUrl,
      events: ['payment_intent.succeeded'],
      status: 'active'
    };
    
    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookUrl('');
    setShowAddForm(false);
  };

  const removeWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id 
        ? { ...w, status: w.status === 'active' ? 'disabled' : 'active' }
        : w
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Webhook Endpoints</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Endpoint
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Webhook endpoints receive HTTP requests when events happen in your account.
        </p>

        {showAddForm && (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Add Webhook Endpoint</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhooks"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addWebhook}
                  className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                >
                  Add Endpoint
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="border px-3 py-1 text-sm rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {webhook.url}
                    </code>
                    <span className={`text-xs px-2 py-1 rounded ${
                      webhook.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webhook.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Events: {webhook.events.join(', ')}
                  </p>
                  {webhook.lastDelivery && (
                    <p className="text-xs text-gray-500">
                      Last delivery: {new Date(webhook.lastDelivery).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleWebhook(webhook.id)}
                    className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                  >
                    {webhook.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => removeWebhook(webhook.id)}
                    className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {webhooks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No webhook endpoints configured</p>
            <p className="text-sm">Add an endpoint to receive real-time notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}