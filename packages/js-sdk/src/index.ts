interface SBTCGatewayConfig {
  apiKey: string;
  apiBase?: string;
}

interface CreatePaymentIntentRequest {
  amount: number;
  amount_usd?: number;
  currency: 'sbtc';
  description?: string;
  customer_address?: string;
  metadata?: Record<string, string>;
  return_url?: string;
}

interface PaymentIntent {
  id: string;
  amount: number;
  amount_usd?: number;
  currency: 'sbtc';
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'canceled';
  customer_address?: string;
  description?: string;
  metadata?: Record<string, string>;
  payment_method?: string;
  receipt_url?: string;
  tx_id?: string;
  created: number;
}

class PaymentIntents {
  constructor(private gateway: SBTCGateway) {}

  async create(params: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    return this.gateway.request('POST', '/v1/payment_intents', params);
  }

  async retrieve(id: string): Promise<PaymentIntent> {
    return this.gateway.request('GET', `/v1/payment_intents/${id}`);
  }

  async confirm(id: string, params?: { 
    payment_method?: string; 
    customer_address?: string;
    return_url?: string;
  }): Promise<PaymentIntent> {
    return this.gateway.request('POST', `/v1/payment_intents/${id}/confirm`, params || {});
  }

  async cancel(id: string): Promise<PaymentIntent> {
    return this.gateway.request('POST', `/v1/payment_intents/${id}/cancel`);
  }

  async list(params?: { 
    limit?: number; 
    offset?: number; 
  }): Promise<{ data: PaymentIntent[]; has_more: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    
    return this.gateway.request('GET', `/v1/payment_intents?${query.toString()}`);
  }
}

class SBTCGateway {
  public paymentIntents: PaymentIntents;
  private apiKey: string;
  private apiBase: string;

  constructor(config: SBTCGatewayConfig) {
    this.apiKey = config.apiKey;
    this.apiBase = config.apiBase || 'https://api.sbtcgateway.com';
    this.paymentIntents = new PaymentIntents(this);
  }

  async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.apiBase}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'SBTC-Gateway-JS/1.0.0'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new SBTCGatewayError(
        responseData.error?.message || 'Request failed',
        response.status,
        responseData.error?.type,
        responseData.error?.code
      );
    }

    return responseData;
  }

  // Utility methods
  static async getExchangeRate(apiBase?: string): Promise<{ sbtc_usd: number; timestamp: number; source: string }> {
    const base = apiBase || 'https://api.sbtcgateway.com';
    const response = await fetch(`${base}/v1/public/exchange_rate`);
    return response.json();
  }

  static async validateAddress(address: string, apiBase?: string): Promise<{ address: string; valid: boolean; network: string }> {
    const base = apiBase || 'https://api.sbtcgateway.com';
    const response = await fetch(`${base}/v1/public/validate_address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    return response.json();
  }
}

class SBTCGatewayError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public type?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'SBTCGatewayError';
  }
}

// Export everything
export {
  SBTCGateway,
  SBTCGatewayError,
  PaymentIntents,
  type SBTCGatewayConfig,
  type CreatePaymentIntentRequest,
  type PaymentIntent
};

// Default export
export default SBTCGateway;