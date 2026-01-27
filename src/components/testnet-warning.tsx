'use client';

import { useState, useEffect } from 'react';

export function TestnetWarning() {
  const [isVisible, setIsVisible] = useState(true);
  
  // Store dismissal in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('testnet-warning-dismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('testnet-warning-dismissed', 'true');
    // Optional: Set expiration for dismissal
    localStorage.setItem('testnet-warning-dismissed-timestamp', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm font-medium z-[100]">
      <div className="flex items-center justify-center gap-3">
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="animate-pulse">⚠️</span>
          <span>
            TESTNET ONLY - This application currently supports testnet wallets only. Do not use mainnet wallets or send real Bitcoin. Get sBTC{' '}
            <a 
              href="https://platform.hiro.so/faucet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-red-100 font-semibold"
            >
              faucet here
            </a>
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-white hover:text-red-100 font-bold text-lg px-2"
          aria-label="Dismiss warning"
        >
          ×
        </button>
      </div>
    </div>
  );
}
