/**
 * WebSocket Service — Real-time UI Updates
 * 
 * Connects to the backend WebSocket server.
 * Dispatches pipeline events directly into app state.
 *
 * Production: wss://api.hireflow.io/ws
 * Development: ws://localhost:3001/ws
 *
 * Falls back gracefully to polling when WS is unavailable.
 */

import { logger }          from '@/shared/lib/logger';
import { useToastStore }   from '@/shared/stores/toastStore';
import type { WSMessage, WSEventType } from '@/types';

type WSHandler<T = unknown> = (payload: T) => void;

class WebSocketService {
  private ws:       WebSocket | null  = null;
  private handlers: Map<WSEventType, WSHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnects     = 5;
  private reconnectDelay    = 2000;

  connect(url: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = (): void => {
        logger.info('[WS] Connected', { url });
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event: MessageEvent): void => {
        try {
          const msg = JSON.parse(event.data as string) as WSMessage;
          this.dispatch(msg.event, msg.payload);
        } catch (e) {
          logger.warn('[WS] Failed to parse message', { error: String(e) });
        }
      };

      this.ws.onclose = (event): void => {
        logger.warn('[WS] Disconnected', { code: event.code });
        this.scheduleReconnect(url);
      };

      this.ws.onerror = (err): void => {
        logger.error('[WS] Error', { error: String(err) });
      };
    } catch (e) {
      logger.warn('[WS] WebSocket not available — pipeline events via EventBus only');
    }
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnects) {
      logger.warn('[WS] Max reconnect attempts reached. Using polling fallback.');
      useToastStore.getState().addToast(
        'Live updates unavailable',
        'Switched to polling mode.',
        'amber',
      );
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => this.connect(url), delay);
  }

  on<T>(event: WSEventType, handler: WSHandler<T>): () => void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, handler as WSHandler]);
    // Return unsubscribe function
    return () => {
      const list = this.handlers.get(event) ?? [];
      this.handlers.set(event, list.filter(h => h !== handler));
    };
  }

  private dispatch(event: WSEventType, payload: unknown): void {
    const handlers = this.handlers.get(event) ?? [];
    handlers.forEach(h => h(payload));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  /** Emit event locally (bridges pipeline EventBus → WS handlers) */
  localEmit(event: WSEventType, payload: unknown): void {
    this.dispatch(event, payload);
  }
}

export const wsService = new WebSocketService();
