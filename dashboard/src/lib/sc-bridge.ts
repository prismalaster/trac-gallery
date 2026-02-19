import type { CuratedNFT, ConnectionState } from './types';
import { SC_BRIDGE_URL, SC_BRIDGE_TOKEN, GALLERY_CHANNEL } from './constants';

type MessageHandler = (nfts: CuratedNFT[]) => void;
type StateHandler = (state: ConnectionState) => void;
type CliHandler = (result: unknown) => void;

export class ScBridgeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private onNfts: MessageHandler | null = null;
  private onState: StateHandler | null = null;
  private pendingCli: Map<number, CliHandler> = new Map();
  private cliId = 0;
  private shouldReconnect = true;

  constructor(url?: string, token?: string) {
    this.url = url || SC_BRIDGE_URL;
    this.token = token || SC_BRIDGE_TOKEN;
  }

  onNftUpdate(handler: MessageHandler) { this.onNfts = handler; }
  onStateChange(handler: StateHandler) { this.onState = handler; }

  connect() {
    this.shouldReconnect = true;
    this._connect();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  private _connect() {
    this.onState?.('connecting');
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      // Authenticate
      this._send({ type: 'auth', token: this.token });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        this._handleMessage(msg);
      } catch { /* ignore parse errors */ }
    };

    this.ws.onclose = () => {
      this.onState?.('disconnected');
      this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private _handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case 'auth_ok':
        this.onState?.('connected');
        this._send({ type: 'subscribe', channel: GALLERY_CHANNEL });
        break;

      case 'sidechannel_message': {
        const raw = msg.message;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'tracgallery_curated' || parsed.type === 'tracgallery_response') {
              if (Array.isArray(parsed.data)) {
                this.onNfts?.(parsed.data as CuratedNFT[]);
              }
            }
          } catch { /* not gallery message */ }
        }
        break;
      }

      case 'cli_result': {
        const id = msg.id as number;
        const handler = this.pendingCli.get(id);
        if (handler) {
          this.pendingCli.delete(id);
          handler(msg);
        }
        break;
      }
    }
  }

  async sendCli(command: string): Promise<unknown> {
    return new Promise((resolve) => {
      const id = ++this.cliId;
      this.pendingCli.set(id, resolve);
      this._send({ type: 'cli', command, id });
      // Timeout after 30s
      setTimeout(() => {
        if (this.pendingCli.has(id)) {
          this.pendingCli.delete(id);
          resolve({ error: 'timeout' });
        }
      }, 30000);
    });
  }

  private _send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private _scheduleReconnect() {
    if (!this.shouldReconnect) return;
    setTimeout(() => {
      if (this.shouldReconnect) this._connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
