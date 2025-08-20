import { ApiKeysSection } from '@/components/dashboard/api-keys-section';
import { WebhooksSection } from '@/components/dashboard/webhooks-section';

export default function DevelopersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Developer Settings</h1>
        <p className="text-gray-600">Manage your API keys, webhooks, and integration settings.</p>
      </div>

      <ApiKeysSection />
      <WebhooksSection />
    </div>
  );
}