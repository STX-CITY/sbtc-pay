import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-gray-900">sBTC Pay</div>
            <div className="space-x-4">
              <Link href="/docs" className="text-gray-600 hover:text-gray-900">
                Documentation
              </Link>
              <Link href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Accept sBTC Payments
            <span className="block text-blue-600">Effortlessly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The modern payment gateway for Bitcoin on Stacks. 
            Build powerful payment experiences with our developer-first platform.
          </p>
          <div className="space-x-4">
            <Link href="/dashboard" className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600">
              Get Started
            </Link>
            <Link href="/docs" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50">
              View Docs
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Accept Bitcoin payments in seconds with sBTC on Stacks blockchain.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
            <p className="text-gray-600">
              Enterprise-grade security with smart contract verification.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2">Developer First</h3>
            <p className="text-gray-600">
              Clean APIs, SDKs, and detailed documentation to get you started quickly.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Try a Demo Payment</h2>
          <div className="max-w-md mx-auto">
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex justify-between mb-2">
                <span>Amount:</span>
                <span className="font-medium">0.001 sBTC</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>USD Equivalent:</span>
                <span className="font-medium">$98.50</span>
              </div>
              <div className="flex justify-between">
                <span>Description:</span>
                <span className="font-medium">Demo Purchase</span>
              </div>
            </div>
            <Link 
              href="/checkout/pi_demo123456"
              className="block w-full bg-blue-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-600"
            >
              Try Demo Payment
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 sBTC Payment Gateway. Built on Stacks blockchain.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}