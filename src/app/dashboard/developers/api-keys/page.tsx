import { ApiKeysSection } from '@/components/dashboard/api-keys-section';

export default function ApiKeysPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="text-gray-600">Manage your API keys for secure access to sBTC Pay services.</p>
      </div>

      <ApiKeysSection />
    </div>
  );
}