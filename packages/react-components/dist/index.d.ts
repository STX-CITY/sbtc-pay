import React from 'react';
import { SBTCGateway, PaymentIntent, CreatePaymentIntentRequest } from '../../js-sdk/dist/index';
interface SBTCProviderProps {
    apiKey: string;
    apiBase?: string;
    children: React.ReactNode;
}
interface SBTCContextValue {
    gateway: SBTCGateway;
    createPaymentIntent: (params: CreatePaymentIntentRequest) => Promise<PaymentIntent>;
    retrievePaymentIntent: (id: string) => Promise<PaymentIntent>;
}
export declare function SBTCProvider({ apiKey, apiBase, children }: SBTCProviderProps): React.JSX.Element;
export declare function useSBTC(): SBTCContextValue;
interface PaymentButtonProps {
    amount: number;
    amount_usd?: number;
    description?: string;
    metadata?: Record<string, string>;
    onSuccess?: (paymentIntent: PaymentIntent) => void;
    onError?: (error: Error) => void;
    className?: string;
    children?: React.ReactNode;
}
export declare function PaymentButton({ amount, amount_usd, description, metadata, onSuccess, onError, className, children }: PaymentButtonProps): React.JSX.Element;
interface PaymentStatusProps {
    paymentIntentId: string;
    onStatusChange?: (status: string) => void;
    pollInterval?: number;
}
export declare function PaymentStatus({ paymentIntentId, onStatusChange, pollInterval }: PaymentStatusProps): React.JSX.Element;
export * from '../../js-sdk/dist/index';
//# sourceMappingURL=index.d.ts.map