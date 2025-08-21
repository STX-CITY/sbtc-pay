'use client';

import { useState } from 'react';
import Link from 'next/link';

export function DocsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const quickLinks = [
    { href: '/docs', label: '📚 Documentation', icon: '📚' },
    { href: '/webhook-guide', label: '🔔 Webhook Guide', icon: '🔔' },
    { href: '/test_webhook', label: '🧪 Test Webhooks', icon: '🧪' },
    { href: '/dashboard/developers', label: '⚙️ Developer Tools', icon: '⚙️' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Links Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="flex items-center space-x-3 bg-white text-gray-700 px-4 py-3 rounded-lg shadow-lg border hover:bg-gray-50 transition-all transform hover:scale-105 whitespace-nowrap"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xl transition-all transform hover:scale-110 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isOpen ? '✕' : '?'}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}