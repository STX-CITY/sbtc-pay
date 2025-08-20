export interface CreatePaymentIntentRequest {
  amount: number;
  amount_usd?: number;
  currency: 'sbtc';
  description?: string;
  customer_address?: string;
  metadata?: Record<string, string>;
  return_url?: string;
}

export interface PaymentIntentResponse {
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

export interface CreatePaymentMethodRequest {
  customer_address: string;
  type: 'sbtc';
}

export interface PaymentMethodResponse {
  id: string;
  customer_address: string;
  type: 'sbtc';
  created: number;
}

export interface WebhookEventData {
  id: string;
  type: 'payment_intent.succeeded' | 'payment_intent.failed' | 'payment_intent.created';
  data: {
    object: PaymentIntentResponse;
  };
  created: number;
}

export interface ExchangeRateResponse {
  sbtc_usd: number;
  timestamp: number;
  source: string;
}

export interface ApiError {
  error: {
    type: string;
    message: string;
    code?: string;
  };
}