'use client';

/**
 * Get the stored API key from localStorage
 */
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('api_key');
}

/**
 * Get the stored merchant ID from localStorage
 */
export function getStoredMerchantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('merchant_id');
}

/**
 * Create authenticated fetch with automatic API key header
 */
export function createAuthenticatedFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const apiKey = getStoredApiKey();
    
    if (!apiKey) {
      throw new Error('No API key found. Please login again.');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);
    headers.set('Content-Type', 'application/json');

    return fetch(url, {
      ...options,
      headers
    });
  };
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const apiKey = getStoredApiKey();
  
  if (!apiKey) {
    throw new Error('No API key found. Please login again.');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Check if user is authenticated (has API key)
 */
export function isAuthenticated(): boolean {
  return !!getStoredApiKey();
}

/**
 * Clear authentication data from localStorage
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('api_key');
  localStorage.removeItem('merchant_id');
  localStorage.removeItem('merchant_address');
}