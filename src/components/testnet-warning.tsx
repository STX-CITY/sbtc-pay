'use client';

export function TestnetWarning() {
  return (
    <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium">
      ⚠️ TESTNET ONLY - This application currently supports testnet wallets only. Do not use mainnet wallets or send real Bitcoin.
    </div>
  );
}