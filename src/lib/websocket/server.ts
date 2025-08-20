import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface PaymentStatusUpdate {
  type: 'payment_status_update';
  payment_intent_id: string;
  status: string;
  tx_id?: string;
  timestamp: number;
}

class PaymentWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, Set<any>>();

  init(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/payments'
    });

    this.wss.on('connection', (ws, request: IncomingMessage) => {
      const url = parse(request.url || '', true);
      const paymentIntentId = url.query.payment_intent_id as string;

      if (!paymentIntentId) {
        ws.close(1008, 'Missing payment_intent_id');
        return;
      }

      // Add connection to payment intent subscribers
      if (!this.connections.has(paymentIntentId)) {
        this.connections.set(paymentIntentId, new Set());
      }
      this.connections.get(paymentIntentId)!.add(ws);

      ws.on('close', () => {
        const subscribers = this.connections.get(paymentIntentId);
        if (subscribers) {
          subscribers.delete(ws);
          if (subscribers.size === 0) {
            this.connections.delete(paymentIntentId);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        payment_intent_id: paymentIntentId,
        timestamp: Date.now()
      }));
    });
  }

  broadcast(paymentIntentId: string, update: PaymentStatusUpdate) {
    const subscribers = this.connections.get(paymentIntentId);
    if (!subscribers) return;

    const message = JSON.stringify(update);
    subscribers.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  broadcastPaymentUpdate(paymentIntentId: string, status: string, txId?: string) {
    this.broadcast(paymentIntentId, {
      type: 'payment_status_update',
      payment_intent_id: paymentIntentId,
      status,
      tx_id: txId,
      timestamp: Date.now()
    });
  }
}

export const paymentWebSocketServer = new PaymentWebSocketServer();