import { MerchantRegistration } from '@/components/auth/merchant-registration';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">sBTC Payment Gateway</h1>
          <p className="text-gray-600 mt-2">Start accepting sBTC payments in minutes</p>
        </div>
        
        <MerchantRegistration />

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:text-blue-700">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}