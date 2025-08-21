'use client';

export function PaymentComparison() {
  const features = [
    {
      feature: 'Setup Time',
      walletConnect: '< 1 minute',
      manual: '2-3 minutes',
      walletIcon: '⚡',
      manualIcon: '⏱️'
    },
    {
      feature: 'User Experience',
      walletConnect: 'One-click payment',
      manual: 'Copy & paste details',
      walletIcon: '✨',
      manualIcon: '📋'
    },
    {
      feature: 'Verification',
      walletConnect: 'Automatic',
      manual: 'Blockchain monitoring',
      walletIcon: '🤖',
      manualIcon: '🔍'
    },
    {
      feature: 'Speed',
      walletConnect: 'Instant',
      manual: '1-5 minutes',
      walletIcon: '🚀',
      manualIcon: '⏳'
    },
    {
      feature: 'Wallet Required',
      walletConnect: 'Yes (Hiro, Xverse)',
      manual: 'Any sBTC wallet',
      walletIcon: '✅',
      manualIcon: '🔓'
    },
    {
      feature: 'Mobile Friendly',
      walletConnect: 'Excellent',
      manual: 'Good',
      walletIcon: '📱',
      manualIcon: '📲'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
        <h3 className="text-xl font-bold mb-2">💳 Payment Methods Comparison</h3>
        <p className="text-green-100">Choose the best payment flow for your customers</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                <div className="flex items-center justify-center space-x-2">
                  <span>🔗</span>
                  <span>Wallet Connect</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                <div className="flex items-center justify-center space-x-2">
                  <span>📝</span>
                  <span>Manual Payment</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {features.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {item.feature}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">{item.walletIcon}</span>
                    <span className="text-sm text-gray-700">{item.walletConnect}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">{item.manualIcon}</span>
                    <span className="text-sm text-gray-700">{item.manual}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50 p-6 border-t">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">🔗 Wallet Connect</h4>
            <p className="text-sm text-blue-700">
              Best for tech-savvy users who already have Stacks wallets. 
              Provides the smoothest checkout experience.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">📝 Manual Payment</h4>
            <p className="text-sm text-blue-700">
              Perfect for users who prefer manual control or use different wallets. 
              Still automated verification via blockchain monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}