'use client';

/**
 * Get the stored API key from localStorage
 */
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('api_key');
  } catch (error) {
    console.error('Failed to access localStorage:', error);
    return null;
  }
}

/**
 * Get the stored merchant ID from localStorage
 */
export function getStoredMerchantId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('merchant_id');
  } catch (error) {
    console.error('Failed to access localStorage:', error);
    return null;
  }
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
  try {
    const apiKey = getStoredApiKey();
    
    if (!apiKey) {
      console.error('No API key found in localStorage');
      throw new Error('No API key found. Please login again.');
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error in getAuthHeaders:', error);
    throw error;
  }
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