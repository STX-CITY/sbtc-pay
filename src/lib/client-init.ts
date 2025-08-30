'use client';

// Global error handler for uncaught errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  });

  // Check localStorage availability
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('localStorage is available');
  } catch (e) {
    console.error('localStorage is not available:', e);
  }

  // Log initial page load
  console.log('Client initialized:', {
    pathname: window.location.pathname,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    isProduction: window.location.hostname !== 'localhost',
    timestamp: new Date().toISOString()
  });
}

export {};