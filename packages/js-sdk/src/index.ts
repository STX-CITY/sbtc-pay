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

interface Product {
  id: string;
  name: string;
  description?: string;
  price_sbtc: number;
  price_usd?: number;
  active: boolean;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface CreateProductRequest {
  name: string;
  description?: string;
  price_sbtc: number;
  price_usd?: number;
  active?: boolean;
  metadata?: Record<string, string>;
}

interface UpdateProductRequest {
  name?: string;
  description?: string;
  price_sbtc?: number;
  price_usd?: number;
  active?: boolean;
  metadata?: Record<string, string>;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  events: string[];
  active: boolean;
  secret: string;
  created_at: string;
  updated_at: string;
}

interface CreateWebhookEndpointRequest {
  url: string;
  description?: string;
  events: string[];
  active?: boolean;
}

interface WebhookEvent {
  id: string;
  event_type: string;
  data: any;
  created_at: string;
  webhook_endpoint_id?: string;
  status?: 'pending' | 'delivered' | 'failed';
  attempts?: number;
  last_attempt?: string;
  next_retry?: string;
}

interface DashboardStats {
  total_payments: number;
  total_revenue_sbtc: number;
  total_revenue_usd: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  average_payment_sbtc: number;
  payments_this_month: number;
  revenue_this_month_sbtc: number;
  growth_rate: number;
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

class Products {
  constructor(private gateway: SBTCGateway) {}

  async create(params: CreateProductRequest): Promise<Product> {
    return this.gateway.request('POST', '/v1/products', params);
  }

  async retrieve(id: string): Promise<Product> {
    return this.gateway.request('GET', `/v1/products/${id}`);
  }

  async update(id: string, params: UpdateProductRequest): Promise<Product> {
    return this.gateway.request('PUT', `/v1/products/${id}`, params);
  }

  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.gateway.request('DELETE', `/v1/products/${id}`);
  }

  async list(params?: { 
    limit?: number; 
    offset?: number;
    active?: boolean;
  }): Promise<{ data: Product[]; has_more: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.active !== undefined) query.set('active', params.active.toString());
    
    return this.gateway.request('GET', `/v1/products?${query.toString()}`);
  }
}

class WebhookEndpoints {
  constructor(private gateway: SBTCGateway) {}

  async create(params: CreateWebhookEndpointRequest): Promise<WebhookEndpoint> {
    return this.gateway.request('POST', '/v1/webhook-endpoints', params);
  }

  async retrieve(id: string): Promise<WebhookEndpoint> {
    return this.gateway.request('GET', `/v1/webhook-endpoints/${id}`);
  }

  async update(id: string, params: Partial<CreateWebhookEndpointRequest>): Promise<WebhookEndpoint> {
    return this.gateway.request('PUT', `/v1/webhook-endpoints/${id}`, params);
  }

  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.gateway.request('DELETE', `/v1/webhook-endpoints/${id}`);
  }

  async list(): Promise<{ data: WebhookEndpoint[] }> {
    return this.gateway.request('GET', '/v1/webhook-endpoints');
  }
}

class WebhookEvents {
  constructor(private gateway: SBTCGateway) {}

  async list(params?: {
    limit?: number;
    offset?: number;
    event_type?: string;
    webhook_endpoint_id?: string;
  }): Promise<{ data: WebhookEvent[]; has_more: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.event_type) query.set('event_type', params.event_type);
    if (params?.webhook_endpoint_id) query.set('webhook_endpoint_id', params.webhook_endpoint_id);
    
    return this.gateway.request('GET', `/v1/webhook-events?${query.toString()}`);
  }

  async retrieve(id: string): Promise<WebhookEvent> {
    return this.gateway.request('GET', `/v1/webhook-events/${id}`);
  }

  async retry(id: string): Promise<{ success: boolean; message: string }> {
    return this.gateway.request('POST', `/v1/webhook-events/${id}/retry`);
  }
}

class Dashboard {
  constructor(private gateway: SBTCGateway) {}

  async getStats(): Promise<DashboardStats> {
    return this.gateway.request('GET', '/v1/dashboard/stats');
  }

  async getPayments(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ data: PaymentIntent[]; has_more: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    
    return this.gateway.request('GET', `/v1/dashboard/payments?${query.toString()}`);
  }
}

class SBTCGateway {
  public paymentIntents: PaymentIntents;
  public products: Products;
  public webhookEndpoints: WebhookEndpoints;
  public webhookEvents: WebhookEvents;
  public dashboard: Dashboard;
  private apiKey: string;
  private apiBase: string;

  constructor(config: SBTCGatewayConfig) {
    this.apiKey = config.apiKey;
    this.apiBase = config.apiBase || 'https://api.sbtcgateway.com';
    this.paymentIntents = new PaymentIntents(this);
    this.products = new Products(this);
    this.webhookEndpoints = new WebhookEndpoints(this);
    this.webhookEvents = new WebhookEvents(this);
    this.dashboard = new Dashboard(this);
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

  static async getPublicPaymentIntent(id: string, apiBase?: string): Promise<PaymentIntent> {
    const base = apiBase || 'https://api.sbtcgateway.com';
    const response = await fetch(`${base}/v1/public/payment_intents/${id}`);
    return response.json();
  }

  // Webhook signature verification
  static async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    if (typeof crypto === 'undefined') {
      // Node.js environment
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      return `sha256=${expectedSignature}` === signature;
    } else {
      // Browser environment
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature_buffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );
      const expectedSignature = Array.from(new Uint8Array(signature_buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return `sha256=${expectedSignature}` === signature;
    }
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
  Products,
  WebhookEndpoints,
  WebhookEvents,
  Dashboard,
  type SBTCGatewayConfig,
  type CreatePaymentIntentRequest,
  type PaymentIntent,
  type Product,
  type CreateProductRequest,
  type UpdateProductRequest,
  type WebhookEndpoint,
  type CreateWebhookEndpointRequest,
  type WebhookEvent,
  type DashboardStats
};

// Default export
export default SBTCGateway;