"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SBTCProvider = SBTCProvider;
exports.useSBTC = useSBTC;
exports.PaymentButton = PaymentButton;
exports.PaymentStatus = PaymentStatus;
const react_1 = __importStar(require("react"));
const index_1 = require("../../js-sdk/dist/index");
const SBTCContext = react_1.default.createContext(null);
function SBTCProvider({ apiKey, apiBase, children }) {
    const gateway = new index_1.SBTCGateway({ apiKey, apiBase });
    const createPaymentIntent = (0, react_1.useCallback)((params) => gateway.paymentIntents.create(params), [gateway]);
    const retrievePaymentIntent = (0, react_1.useCallback)((id) => gateway.paymentIntents.retrieve(id), [gateway]);
    const value = {
        gateway,
        createPaymentIntent,
        retrievePaymentIntent
    };
    return (react_1.default.createElement(SBTCContext.Provider, { value: value }, children));
}
function useSBTC() {
    const context = react_1.default.useContext(SBTCContext);
    if (!context) {
        throw new Error('useSBTC must be used within an SBTCProvider');
    }
    return context;
}
function PaymentButton({ amount, amount_usd, description, metadata, onSuccess, onError, className = '', children }) {
    const { createPaymentIntent } = useSBTC();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleClick = async () => {
        if (loading)
            return;
        setLoading(true);
        try {
            const paymentIntent = await createPaymentIntent({
                amount,
                amount_usd,
                currency: 'sbtc',
                description,
                metadata
            });
            // Redirect to checkout page
            window.location.href = `/checkout/${paymentIntent.id}`;
            onSuccess?.(paymentIntent);
        }
        catch (error) {
            onError?.(error);
        }
        finally {
            setLoading(false);
        }
    };
    const defaultClassName = `
    bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
    text-white font-semibold py-2 px-4 rounded
    transition-colors duration-200
    ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
  `.trim();
    return (react_1.default.createElement("button", { onClick: handleClick, disabled: loading, className: className || defaultClassName }, loading ? 'Processing...' : (children || 'Pay with sBTC')));
}
function PaymentStatus({ paymentIntentId, onStatusChange, pollInterval = 5000 }) {
    const { retrievePaymentIntent } = useSBTC();
    const [paymentIntent, setPaymentIntent] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchStatus = (0, react_1.useCallback)(async () => {
        try {
            const pi = await retrievePaymentIntent(paymentIntentId);
            setPaymentIntent(pi);
            onStatusChange?.(pi.status);
            // Stop polling if payment is final
            if (['succeeded', 'failed', 'canceled'].includes(pi.status)) {
                return false; // Stop polling
            }
            return true; // Continue polling
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch payment status');
            return false;
        }
        finally {
            setLoading(false);
        }
    }, [paymentIntentId, retrievePaymentIntent, onStatusChange]);
    (0, react_1.useEffect)(() => {
        let intervalId;
        const poll = async () => {
            const shouldContinue = await fetchStatus();
            if (shouldContinue) {
                intervalId = setTimeout(poll, pollInterval);
            }
        };
        poll();
        return () => {
            if (intervalId)
                clearTimeout(intervalId);
        };
    }, [fetchStatus, pollInterval]);
    if (loading && !paymentIntent) {
        return react_1.default.createElement("div", null, "Loading payment status...");
    }
    if (error) {
        return react_1.default.createElement("div", { className: "text-red-600" },
            "Error: ",
            error);
    }
    if (!paymentIntent) {
        return react_1.default.createElement("div", null, "Payment not found");
    }
    const statusColors = {
        created: 'text-gray-600',
        pending: 'text-yellow-600',
        succeeded: 'text-green-600',
        failed: 'text-red-600',
        canceled: 'text-gray-600'
    };
    return (react_1.default.createElement("div", { className: "p-4 border rounded" },
        react_1.default.createElement("div", { className: "flex items-center gap-2 mb-2" },
            react_1.default.createElement("span", { className: "font-medium" }, "Payment Status:"),
            react_1.default.createElement("span", { className: `font-semibold ${statusColors[paymentIntent.status]}` }, paymentIntent.status.toUpperCase())),
        react_1.default.createElement("div", { className: "text-sm text-gray-600 space-y-1" },
            react_1.default.createElement("div", null,
                "Amount: ",
                (paymentIntent.amount / 100000000).toFixed(8),
                " sBTC"),
            paymentIntent.amount_usd && (react_1.default.createElement("div", null,
                "USD: $",
                paymentIntent.amount_usd.toFixed(2))),
            paymentIntent.tx_id && (react_1.default.createElement("div", null,
                "Transaction: ",
                paymentIntent.tx_id.slice(0, 16),
                "...")))));
}
__exportStar(require("../../js-sdk/dist/index"), exports);
//# sourceMappingURL=index.js.map