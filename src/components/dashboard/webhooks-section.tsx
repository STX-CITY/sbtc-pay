'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/auth/client';

interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  events: string[];
  active: boolean;
  created: number;
  updated: number;
}

const AVAILABLE_EVENTS = [
  { id: 'payment_intent.created', label: 'Payment Intent Created' },
  { id: 'payment_intent.succeeded', label: 'Payment Intent Succeeded' },
  { id: 'payment_intent.failed', label: 'Payment Intent Failed' },
  { id: 'payment_intent.canceled', label: 'Payment Intent Canceled' },
  { id: 'product.created', label: 'Product Created' },
  { id: 'product.updated', label: 'Product Updated' },
  { id: 'product.deleted', label: 'Product Deleted' },
  { id: 'merchant.updated', label: 'Merchant Updated' }
];

export function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookDescription, setNewWebhookDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['payment_intent.succeeded', 'payment_intent.failed']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/v1/webhook-endpoints', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhook endpoints');
      }

      const data = await response.json();
      setWebhooks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const addWebhook = async () => {
    if (!newWebhookUrl || selectedEvents.length === 0) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/webhook-endpoints', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: newWebhookUrl,
          description: newWebhookDescription || undefined,
          events: selectedEvents,
          active: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create webhook endpoint');
      }

      const newWebhook = await response.json();
      setWebhooks([...webhooks, newWebhook]);
      setNewWebhookUrl('');
      setNewWebhookDescription('');
      setSelectedEvents(['payment_intent.succeeded', 'payment_intent.failed']);
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setSubmitting(false);
    }
  };

  const removeWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/webhook-endpoints/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete webhook endpoint');
      }

      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    }
  };

  const toggleWebhook = async (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) return;

    try {
      const response = await fetch(`/api/v1/webhook-endpoints/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          active: !webhook.active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update webhook endpoint');
      }

      const updatedWebhook = await response.json();
      setWebhooks(webhooks.map(w => w.id === id ? updatedWebhook : w));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    }
  };

  const testWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/webhook-endpoints/${id}/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to send test webhook');
      }

      alert('Test webhook sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test webhook');
    }
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Webhook Endpoints</h2>
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Webhook Endpoints</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={showAddForm}
          >
            Add Endpoint
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Webhook endpoints receive HTTP requests when events happen in your account.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {showAddForm && (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Add Webhook Endpoint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Endpoint URL *</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhooks"
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newWebhookDescription}
                  onChange={(e) => setNewWebhookDescription(e.target.value)}
                  placeholder="Internal description for this endpoint"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Events to receive *</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label key={event.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={() => handleEventToggle(event.id)}
                        className="rounded"
                      />
                      <span className="text-xs">{event.label}</span>
                    </label>
                  ))}
                </div>
                {selectedEvents.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">Select at least one event</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addWebhook}
                  disabled={!newWebhookUrl || selectedEvents.length === 0 || submitting}
                  className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Add Endpoint'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWebhookUrl('');
                    setNewWebhookDescription('');
                    setSelectedEvents(['payment_intent.succeeded', 'payment_intent.failed']);
                  }}
                  className="border px-3 py-1 text-sm rounded hover:bg-gray-50"
                  disabled={submitting}
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
                      webhook.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webhook.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  
                  {webhook.description && (
                    <p className="text-xs text-gray-600 mb-1">{webhook.description}</p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Events: {webhook.events.join(', ')}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Created: {new Date(webhook.created * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => testWebhook(webhook.id)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    disabled={!webhook.active}
                  >
                    Test
                  </button>
                  <button
                    onClick={() => toggleWebhook(webhook.id)}
                    className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                  >
                    {webhook.active ? 'Disable' : 'Enable'}
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

        {webhooks.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-500">
            <p>No webhook endpoints configured</p>
            <p className="text-sm">Add an endpoint to receive real-time notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}