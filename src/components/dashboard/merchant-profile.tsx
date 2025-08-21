'use client';

import { useState, useEffect } from 'react';

interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  stacksAddress: string;
  recipientAddress?: string;
  webhookUrl?: string;
  apiKeyTest: string;
  created: number;
}

export function MerchantProfile() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    recipientAddress: '',
    webhookUrl: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const apiKey = localStorage.getItem('api_key');
      
      const response = await fetch('/api/v1/merchants/profile', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditData({
        name: data.name,
        email: data.email,
        recipientAddress: data.recipientAddress || data.stacksAddress,
        webhookUrl: data.webhookUrl || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const apiKey = localStorage.getItem('api_key');
      
      const response = await fetch('/api/v1/merchants/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      setProfile(data);
      setSuccess(data.message || 'Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard`);
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Failed to load profile'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Merchant Profile</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Recipient Address
              </label>
              <input
                type="text"
                value={editData.recipientAddress}
                onChange={(e) => setEditData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ST1234..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Stacks address where payments will be sent. Defaults to your connected wallet address.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={editData.webhookUrl}
                onChange={(e) => setEditData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourdomain.com/webhook"
              />
              <p className="text-xs text-gray-500 mt-1">
                Receive real-time payment notifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stacks Address (Read-only)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.stacksAddress}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(profile.stacksAddress, 'Stacks address')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full py-2 px-4 rounded font-medium ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">API Keys</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={profile.apiKeyTest}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(profile.apiKeyTest, 'Test API key')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this key for testing. No real payments will be processed.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Live API Key</h3>
              <p className="text-sm text-yellow-800">
                Contact support to get your live API key for production use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Merchant ID</dt>
            <dd className="mt-1 text-gray-900 font-mono">{profile.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Account Created</dt>
            <dd className="mt-1 text-gray-900">
              {new Date(profile.created * 1000).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}