import { ApiKeysSection } from '@/components/dashboard/api-keys-section';
import { WebhooksSection } from '@/components/dashboard/webhooks-section';
import { WebhookTester } from '@/components/dashboard/webhook-tester';

export default function DevelopersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Developer Settings</h1>
        <p className="text-gray-600">Manage your API keys, webhooks, and integration settings.</p>
        
        <div className="mt-4 flex gap-4">
          <a
            href="/webhook-guide"
            target="_blank"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            📋 Webhook Integration Guide
          </a>
          <a
            href="/webhook-utils.js"
            target="_blank"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
          >
            💻 Download Utilities
          </a>
          <a
            href="/test_webhook"
            target="_blank"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100"
          >
            🧪 Test Dashboard
          </a>
        </div>
      </div>

      <ApiKeysSection />
      <WebhooksSection />
      <WebhookTester />
    </div>
  );
}