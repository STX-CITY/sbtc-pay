'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredApiKey, getStoredMerchantId, clearAuth } from '@/lib/auth/client';

export interface AuthState {
  isAuthenticated: boolean;
  apiKey: string | null;
  merchantId: string | null;
  loading: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    apiKey: null,
    merchantId: null,
    loading: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const apiKey = getStoredApiKey();
    const merchantId = getStoredMerchantId();
    
    setAuthState({
      isAuthenticated: !!(apiKey && merchantId),
      apiKey,
      merchantId,
      loading: false
    });
  };

  const logout = () => {
    clearAuth();
    setAuthState({
      isAuthenticated: false,
      apiKey: null,
      merchantId: null,
      loading: false
    });
    router.push('/');
  };

  const refreshAuth = () => {
    checkAuth();
  };

  return {
    ...authState,
    logout,
    refreshAuth
  };
}