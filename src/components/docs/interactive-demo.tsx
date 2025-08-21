'use client';

import { useState } from 'react';

export function InteractiveDemo() {
  const [activeStep, setActiveStep] = useState(1);
  const [demoData, setDemoData] = useState({
    productName: 'Premium Plan',
    price: 29.99,
    customerEmail: 'demo@example.com'
  });

  const steps = [
    {
      id: 1,
      title: 'Create Product',
      description: 'Set up your product with pricing',
      code: `{
  "name": "${demoData.productName}",
  "price_usd": ${demoData.price},
  "description": "Monthly subscription plan"
}`,
      response: `{
  "id": "prod_demo123",
  "name": "${demoData.productName}",
  "price_usd": ${demoData.price},
  "active": true,
  "created": ${Math.floor(Date.now() / 1000)}
}`
    },
    {
      id: 2,
      title: 'Create Payment Intent',
      description: 'Generate payment intent for checkout',
      code: `{
  "amount": ${Math.round(demoData.price * 100)},
  "currency": "usd",
  "product_id": "prod_demo123",
  "customer_email": "${demoData.customerEmail}"
}`,
      response: `{
  "id": "pi_demo456",
  "amount": ${Math.round(demoData.price * 100)},
  "status": "created",
  "recipient_address": "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  "memo": "pi_demo456"
}`
    },
    {
      id: 3,
      title: 'Process Payment',
      description: 'Customer completes payment',
      code: `// Customer pays via wallet or manual transfer
// Payment is automatically verified on blockchain`,
      response: `{
  "id": "pi_demo456",
  "status": "succeeded",
  "tx_id": "0x1234...5678",
  "amount_paid": ${Math.round(demoData.price * 100)}
}`
    },
    {
      id: 4,
      title: 'Webhook Delivered',
      description: 'Receive confirmation in your app',
      code: `// POST /your-webhook-endpoint
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_demo456",
      "status": "succeeded",
      "customer_email": "${demoData.customerEmail}"
    }
  }
}`,
      response: `// Your app responds
// HTTP 200 OK
// Order fulfilled automatically`
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h3 className="text-xl font-bold mb-2">🚀 Interactive Demo</h3>
        <p className="text-blue-100">See how sBTC Pay works with live examples</p>
      </div>
      
      <div className="p-6">
        {/* Demo Controls */}
        <div className="mb-6 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={demoData.productName}
              onChange={(e) => setDemoData({...demoData, productName: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={demoData.price}
              onChange={(e) => setDemoData({...demoData, price: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
            <input
              type="email"
              value={demoData.customerEmail}
              onChange={(e) => setDemoData({...demoData, customerEmail: e.target.value})}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  activeStep === step.id
                    ? 'bg-blue-600 text-white'
                    : activeStep > step.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {activeStep > step.id ? '✓' : step.id}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
              disabled={activeStep === 4}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Active Step Content */}
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900">{steps[activeStep - 1].title}</h4>
            <p className="text-gray-600 text-sm">{steps[activeStep - 1].description}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2 text-sm">Request</h5>
              <div className="bg-gray-900 rounded p-3 text-xs">
                <pre className="text-gray-300 whitespace-pre-wrap">
                  {steps[activeStep - 1].code}
                </pre>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-2 text-sm">Response</h5>
              <div className="bg-gray-900 rounded p-3 text-xs">
                <pre className="text-green-400 whitespace-pre-wrap">
                  {steps[activeStep - 1].response}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${(activeStep / 4) * 100}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Step {activeStep} of 4
          </p>
        </div>
      </div>
    </div>
  );
}