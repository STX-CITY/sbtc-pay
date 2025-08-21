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
declare class PaymentIntents {
    private gateway;
    constructor(gateway: SBTCGateway);
    create(params: CreatePaymentIntentRequest): Promise<PaymentIntent>;
    retrieve(id: string): Promise<PaymentIntent>;
    confirm(id: string, params?: {
        payment_method?: string;
        customer_address?: string;
        return_url?: string;
    }): Promise<PaymentIntent>;
    cancel(id: string): Promise<PaymentIntent>;
    list(params?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        data: PaymentIntent[];
        has_more: boolean;
    }>;
}
declare class Products {
    private gateway;
    constructor(gateway: SBTCGateway);
    create(params: CreateProductRequest): Promise<Product>;
    retrieve(id: string): Promise<Product>;
    update(id: string, params: UpdateProductRequest): Promise<Product>;
    delete(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    list(params?: {
        limit?: number;
        offset?: number;
        active?: boolean;
    }): Promise<{
        data: Product[];
        has_more: boolean;
    }>;
}
declare class WebhookEndpoints {
    private gateway;
    constructor(gateway: SBTCGateway);
    create(params: CreateWebhookEndpointRequest): Promise<WebhookEndpoint>;
    retrieve(id: string): Promise<WebhookEndpoint>;
    update(id: string, params: Partial<CreateWebhookEndpointRequest>): Promise<WebhookEndpoint>;
    delete(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    list(): Promise<{
        data: WebhookEndpoint[];
    }>;
}
declare class WebhookEvents {
    private gateway;
    constructor(gateway: SBTCGateway);
    list(params?: {
        limit?: number;
        offset?: number;
        event_type?: string;
        webhook_endpoint_id?: string;
    }): Promise<{
        data: WebhookEvent[];
        has_more: boolean;
    }>;
    retrieve(id: string): Promise<WebhookEvent>;
    retry(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
declare class Dashboard {
    private gateway;
    constructor(gateway: SBTCGateway);
    getStats(): Promise<DashboardStats>;
    getPayments(params?: {
        limit?: number;
        offset?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<{
        data: PaymentIntent[];
        has_more: boolean;
    }>;
}
declare class SBTCGateway {
    paymentIntents: PaymentIntents;
    products: Products;
    webhookEndpoints: WebhookEndpoints;
    webhookEvents: WebhookEvents;
    dashboard: Dashboard;
    private apiKey;
    private apiBase;
    constructor(config: SBTCGatewayConfig);
    request(method: string, path: string, data?: any): Promise<any>;
    static getExchangeRate(apiBase?: string): Promise<{
        sbtc_usd: number;
        timestamp: number;
        source: string;
    }>;
    static validateAddress(address: string, apiBase?: string): Promise<{
        address: string;
        valid: boolean;
        network: string;
    }>;
    static getPublicPaymentIntent(id: string, apiBase?: string): Promise<PaymentIntent>;
    static verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
}
declare class SBTCGatewayError extends Error {
    statusCode: number;
    type?: string | undefined;
    code?: string | undefined;
    constructor(message: string, statusCode: number, type?: string | undefined, code?: string | undefined);
}
export { SBTCGateway, SBTCGatewayError, PaymentIntents, Products, WebhookEndpoints, WebhookEvents, Dashboard, type SBTCGatewayConfig, type CreatePaymentIntentRequest, type PaymentIntent, type Product, type CreateProductRequest, type UpdateProductRequest, type WebhookEndpoint, type CreateWebhookEndpointRequest, type WebhookEvent, type DashboardStats };
export default SBTCGateway;
//# sourceMappingURL=index.d.ts.map