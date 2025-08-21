"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = exports.WebhookEvents = exports.WebhookEndpoints = exports.Products = exports.PaymentIntents = exports.SBTCGatewayError = exports.SBTCGateway = void 0;
class PaymentIntents {
    constructor(gateway) {
        this.gateway = gateway;
    }
    async create(params) {
        return this.gateway.request('POST', '/v1/payment_intents', params);
    }
    async retrieve(id) {
        return this.gateway.request('GET', `/v1/payment_intents/${id}`);
    }
    async confirm(id, params) {
        return this.gateway.request('POST', `/v1/payment_intents/${id}/confirm`, params || {});
    }
    async cancel(id) {
        return this.gateway.request('POST', `/v1/payment_intents/${id}/cancel`);
    }
    async list(params) {
        const query = new URLSearchParams();
        if (params?.limit)
            query.set('limit', params.limit.toString());
        if (params?.offset)
            query.set('offset', params.offset.toString());
        return this.gateway.request('GET', `/v1/payment_intents?${query.toString()}`);
    }
}
exports.PaymentIntents = PaymentIntents;
class Products {
    constructor(gateway) {
        this.gateway = gateway;
    }
    async create(params) {
        return this.gateway.request('POST', '/v1/products', params);
    }
    async retrieve(id) {
        return this.gateway.request('GET', `/v1/products/${id}`);
    }
    async update(id, params) {
        return this.gateway.request('PUT', `/v1/products/${id}`, params);
    }
    async delete(id) {
        return this.gateway.request('DELETE', `/v1/products/${id}`);
    }
    async list(params) {
        const query = new URLSearchParams();
        if (params?.limit)
            query.set('limit', params.limit.toString());
        if (params?.offset)
            query.set('offset', params.offset.toString());
        if (params?.active !== undefined)
            query.set('active', params.active.toString());
        return this.gateway.request('GET', `/v1/products?${query.toString()}`);
    }
}
exports.Products = Products;
class WebhookEndpoints {
    constructor(gateway) {
        this.gateway = gateway;
    }
    async create(params) {
        return this.gateway.request('POST', '/v1/webhook-endpoints', params);
    }
    async retrieve(id) {
        return this.gateway.request('GET', `/v1/webhook-endpoints/${id}`);
    }
    async update(id, params) {
        return this.gateway.request('PUT', `/v1/webhook-endpoints/${id}`, params);
    }
    async delete(id) {
        return this.gateway.request('DELETE', `/v1/webhook-endpoints/${id}`);
    }
    async list() {
        return this.gateway.request('GET', '/v1/webhook-endpoints');
    }
}
exports.WebhookEndpoints = WebhookEndpoints;
class WebhookEvents {
    constructor(gateway) {
        this.gateway = gateway;
    }
    async list(params) {
        const query = new URLSearchParams();
        if (params?.limit)
            query.set('limit', params.limit.toString());
        if (params?.offset)
            query.set('offset', params.offset.toString());
        if (params?.event_type)
            query.set('event_type', params.event_type);
        if (params?.webhook_endpoint_id)
            query.set('webhook_endpoint_id', params.webhook_endpoint_id);
        return this.gateway.request('GET', `/v1/webhook-events?${query.toString()}`);
    }
    async retrieve(id) {
        return this.gateway.request('GET', `/v1/webhook-events/${id}`);
    }
    async retry(id) {
        return this.gateway.request('POST', `/v1/webhook-events/${id}/retry`);
    }
}
exports.WebhookEvents = WebhookEvents;
class Dashboard {
    constructor(gateway) {
        this.gateway = gateway;
    }
    async getStats() {
        return this.gateway.request('GET', '/v1/dashboard/stats');
    }
    async getPayments(params) {
        const query = new URLSearchParams();
        if (params?.limit)
            query.set('limit', params.limit.toString());
        if (params?.offset)
            query.set('offset', params.offset.toString());
        if (params?.status)
            query.set('status', params.status);
        if (params?.start_date)
            query.set('start_date', params.start_date);
        if (params?.end_date)
            query.set('end_date', params.end_date);
        return this.gateway.request('GET', `/v1/dashboard/payments?${query.toString()}`);
    }
}
exports.Dashboard = Dashboard;
class SBTCGateway {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiBase = config.apiBase || 'https://api.sbtcgateway.com';
        this.paymentIntents = new PaymentIntents(this);
        this.products = new Products(this);
        this.webhookEndpoints = new WebhookEndpoints(this);
        this.webhookEvents = new WebhookEvents(this);
        this.dashboard = new Dashboard(this);
    }
    async request(method, path, data) {
        const url = `${this.apiBase}${path}`;
        const options = {
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
            throw new SBTCGatewayError(responseData.error?.message || 'Request failed', response.status, responseData.error?.type, responseData.error?.code);
        }
        return responseData;
    }
    // Utility methods
    static async getExchangeRate(apiBase) {
        const base = apiBase || 'https://api.sbtcgateway.com';
        const response = await fetch(`${base}/v1/public/exchange_rate`);
        return response.json();
    }
    static async validateAddress(address, apiBase) {
        const base = apiBase || 'https://api.sbtcgateway.com';
        const response = await fetch(`${base}/v1/public/validate_address`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });
        return response.json();
    }
    static async getPublicPaymentIntent(id, apiBase) {
        const base = apiBase || 'https://api.sbtcgateway.com';
        const response = await fetch(`${base}/v1/public/payment_intents/${id}`);
        return response.json();
    }
    // Webhook signature verification
    static async verifyWebhookSignature(payload, signature, secret) {
        if (typeof crypto === 'undefined') {
            // Node.js environment
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');
            return `sha256=${expectedSignature}` === signature;
        }
        else {
            // Browser environment
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const signature_buffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
            const expectedSignature = Array.from(new Uint8Array(signature_buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return `sha256=${expectedSignature}` === signature;
        }
    }
}
exports.SBTCGateway = SBTCGateway;
class SBTCGatewayError extends Error {
    constructor(message, statusCode, type, code) {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.code = code;
        this.name = 'SBTCGatewayError';
    }
}
exports.SBTCGatewayError = SBTCGatewayError;
// Default export
exports.default = SBTCGateway;
//# sourceMappingURL=index.js.map