import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from './api-keys';
import { verifyToken, extractTokenFromHeader } from './jwt';

export interface AuthContext {
  merchantId: string;
  isTest: boolean;
  email?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthContext | null> {
  const authorization = request.headers.get('authorization');
  
  if (!authorization) {
    return null;
  }

  // Try API key authentication first
  if (authorization.startsWith('sk_')) {
    const result = await validateApiKey(authorization);
    return result;
  }

  // Try JWT token authentication
  const token = extractTokenFromHeader(authorization);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return {
        merchantId: payload.merchantId,
        isTest: false, // JWT tokens are for dashboard access
        email: payload.email
      };
    }
  }

  return null;
}

export function createAuthMiddleware() {
  return async function authMiddleware(request: NextRequest) {
    const auth = await authenticateRequest(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid or missing authentication' } },
        { status: 401 }
      );
    }

    // Add auth context to headers for the API route
    const headers = new Headers(request.headers);
    headers.set('x-merchant-id', auth.merchantId);
    headers.set('x-is-test', auth.isTest.toString());
    if (auth.email) {
      headers.set('x-merchant-email', auth.email);
    }

    return NextResponse.next({
      headers
    });
  };
}

export function getAuthFromHeaders(request: NextRequest): AuthContext | null {
  const merchantId = request.headers.get('x-merchant-id');
  const isTest = request.headers.get('x-is-test');
  const email = request.headers.get('x-merchant-email');

  if (!merchantId || !isTest) {
    return null;
  }

  return {
    merchantId,
    isTest: isTest === 'true',
    email: email || undefined
  };
}