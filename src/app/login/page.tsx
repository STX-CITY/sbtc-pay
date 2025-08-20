import { MerchantLogin } from '@/components/auth/merchant-login';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">sBTC Payment Gateway</h1>
          <p className="text-gray-600 mt-2">Welcome back</p>
        </div>
        
        <MerchantLogin />
      </div>
    </div>
  );
}