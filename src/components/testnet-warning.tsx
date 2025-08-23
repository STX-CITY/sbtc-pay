'use client';

export function TestnetWarning() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm font-medium z-[100]">
      ⚠️ TESTNET ONLY - This application currently supports testnet wallets only. Do not use mainnet wallets or send real Bitcoin.
    </div>
  );
}