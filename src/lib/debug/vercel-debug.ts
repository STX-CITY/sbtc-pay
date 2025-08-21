export const logVercelEnvironment = () => {
  console.log('Vercel Debug Info:', {
    isVercel: !!process.env.VERCEL,
    environment: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION,
    stacksTransactionsVersion: require('@stacks/transactions/package.json')?.version,
    stacksConnectVersion: require('@stacks/connect/package.json')?.version,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    platform: typeof process !== 'undefined' ? process.platform : 'Unknown'
  });
};

export const testStacksImports = async () => {
  try {
    const { Cl } = await import('@stacks/transactions');
    console.log('Dynamic Cl import:', typeof Cl, Object.keys(Cl || {}));
    return Cl;
  } catch (error) {
    console.error('Failed to dynamically import Cl:', error);
    return null;
  }
};