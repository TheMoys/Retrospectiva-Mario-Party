import { ConnectionStatus, GameState, NetworkAction } from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';

export type { ConnectionStatus };

type MessageHandler = (action: NetworkAction, peerId?: string) => void;
type StatusHandler = (status: ConnectionStatus) => void;

interface WireEnvelope {
  msgId: string;
  room: string;
  senderId: string;
  action: NetworkAction;
}

interface OutboxItem {
  envelope: WireEnvelope;
  skipNtfyIfWssConnected?: boolean;
}

interface PendingConnectCallback {
  onConnected?: () => void;
  onError?: (err: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

const TOPIC_PREFIX = 'sprint-party-fenix-v3';
const COREFLUX_WSS_URL = 'wss://iot.coreflux.cloud/mqtt';
const NTFY_BASE_URL = 'https://ntfy.sh';
const CONNECT_TIMEOUT_MS = 10000;
const DEDUP_MAX_SIZE = 500;
const OUTBOX_MAX_SIZE = 50;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function encodeMqttVarInt(value: number): number[] {
  const bytes: number[] = [];
  let n = value;
  do {
    let encoded = n & 0x7f;
    n >>= 7;
    if (n > 0) encoded |= 0x80;
    bytes.push(encoded);
  } while (n > 0);
  return bytes;
}

function encodeMqttString(str: string): number[] {
  const utf8 = textEncoder.encode(str);
  return [(utf8.length >> 8) & 0xff, utf8.length & 0xff, ...utf8];
}

function buildMqttConnectPacket(clientId: string, keepAliveSec = 30): Uint8Array {
  const variableHeader = [
    0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, // "MQTT"
    0x04, // Protocol level 4 (MQTT 3.1.1)
    0x02, // Clean session
    (keepAliveSec >> 8) & 0xff,
    keepAliveSec & 0xff,
  ];
  const payload = encodeMqttString(clientId);
  const remaining = [...variableHeader, ...payload];
  return new Uint8Array([0x10, ...encodeMqttVarInt(remaining.length), ...remaining]);
}

function buildMqttSubscribePacket(packetId: number, topic: string): Uint8Array {
  const remaining = [
    (packetId >> 8) & 0xff,
    packetId & 0xff,
    ...encodeMqttString(topic),
    0x00, // QoS 0
  ];
  return new Uint8Array([0x82, ...encodeMqttVarInt(remaining.length), ...remaining]);
}

function buildMqttPublishPacket(topic: string, payloadStr: string): Uint8Array {
  const topicBytes = encodeMqttString(topic);
  const payloadBytes = textEncoder.encode(payloadStr);
  const remainingLength = topicBytes.length + payloadBytes.length;
  const header = [0x30, ...encodeMqttVarInt(remainingLength)];
  const packet = new Uint8Array(header.length + remainingLength);
  packet.set(header, 0);
  packet.set(topicBytes, header.length);
  packet.set(payloadBytes, header.length + topicBytes.length);
  return packet;
}

function buildMqttPubackPacket(packetId: number): Uint8Array {
  return new Uint8Array([0x40, 0x02, (packetId >> 8) & 0xff, packetId & 0xff]);
}

/**
 * Minimal browser-native MQTT 3.1.1 over Port-443 WSS client.
 * Avoids Node polyfills (Buffer/process/streams) and bypasses non-443 firewalls.
 */
class NativeMqttWssClient {
  private ws: WebSocket | null = null;
  private rxBuffer: Uint8Array = new Uint8Array(0);
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private disposed = false;
  public subscribed = false;

  constructor(
    private readonly brokerUrl: string,
    private readonly clientId: string,
    private readonly listenTopic: string,
    private readonly callbacks: {
      onSubscribed: () => void;
      onMessage: (payloadText: string) => void;
      onDisconnected: () => void;
    }
  ) {
    this.connect();
  }

  private connect(): void {
    if (this.disposed || typeof WebSocket === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.scheduleReconnect();
      return;
    }

    this.rxBuffer = new Uint8Array(0);
    this.subscribed = false;

    try {
      const ws = new WebSocket(this.brokerUrl, ['mqtt']);
      ws.binaryType = 'arraybuffer';
      this.ws = ws;

      ws.onopen = () => {
        if (this.disposed || this.ws !== ws) {
          try {
            ws.close(1000);
          } catch {
            // Ignore close during teardown
          }
          return;
        }
        ws.send(buildMqttConnectPacket(this.clientId, 30));
      };

      ws.onmessage = (event: MessageEvent) => {
        if (this.disposed || this.ws !== ws) return;
        const chunk =
          event.data instanceof ArrayBuffer
            ? new Uint8Array(event.data)
            : typeof event.data === 'string'
            ? textEncoder.encode(event.data)
            : null;
        if (!chunk) return;
        this.appendAndParse(chunk, ws);
      };

      ws.onerror = () => {
        // Handled cleanly in onclose
      };

      ws.onclose = () => {
        if (this.ws === ws) {
          this.ws = null;
        }
        this.clearKeepAlive();
        const wasSubscribed = this.subscribed;
        this.subscribed = false;
        if (!this.disposed) {
          if (wasSubscribed) {
            this.callbacks.onDisconnected();
          }
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private appendAndParse(chunk: Uint8Array, ws: WebSocket): void {
    const merged = new Uint8Array(this.rxBuffer.length + chunk.length);
    merged.set(this.rxBuffer, 0);
    merged.set(chunk, this.rxBuffer.length);
    this.rxBuffer = merged;

    while (this.rxBuffer.length >= 2) {
      let multiplier = 1;
      let remainingLength = 0;
      let idx = 1;
      let encodedByte = 0;
      let incompleteVarInt = false;

      do {
        if (idx >= this.rxBuffer.length) {
          incompleteVarInt = true;
          break;
        }
        encodedByte = this.rxBuffer[idx++];
        remainingLength += (encodedByte & 0x7f) * multiplier;
        multiplier *= 128;
        if (idx > 5) {
          // Malformed packet header
          this.rxBuffer = new Uint8Array(0);
          return;
        }
      } while ((encodedByte & 0x80) !== 0);

      if (incompleteVarInt) break;

      const totalLength = idx + remainingLength;
      if (this.rxBuffer.length < totalLength) break;

      const fixedHeader = this.rxBuffer[0];
      const payload = this.rxBuffer.slice(idx, totalLength);
      this.rxBuffer = this.rxBuffer.slice(totalLength);

      this.handlePacket(fixedHeader, payload, ws);
    }
  }

  private handlePacket(fixedHeader: number, payload: Uint8Array, ws: WebSocket): void {
    const packetType = fixedHeader >> 4;

    if (packetType === 2) {
      // CONNACK
      const returnCode = payload.length >= 2 ? payload[1] : 1;
      if (returnCode === 0 && ws.readyState === WebSocket.OPEN) {
        this.reconnectAttempts = 0;
        ws.send(buildMqttSubscribePacket(1, this.listenTopic));
        this.startKeepAlive(ws);
      }
      return;
    }

    if (packetType === 9) {
      // SUBACK
      this.subscribed = true;
      this.callbacks.onSubscribed();
      return;
    }

    if (packetType === 3) {
      // PUBLISH
      if (payload.length < 2) return;
      const qos = (fixedHeader & 0x06) >> 1;
      const topicLen = (payload[0] << 8) | payload[1];
      let offset = 2 + topicLen;
      if (offset > payload.length) return;

      if (qos > 0) {
        if (offset + 2 > payload.length) return;
        const packetId = (payload[offset] << 8) | payload[offset + 1];
        offset += 2;
        if (qos === 1 && ws.readyState === WebSocket.OPEN) {
          ws.send(buildMqttPubackPacket(packetId));
        }
      }

      const bodyText = textDecoder.decode(payload.slice(offset));
      this.callbacks.onMessage(bodyText);
    }
  }

  private startKeepAlive(ws: WebSocket): void {
    this.clearKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (!this.disposed && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
        } catch {
          // Will trigger onclose
        }
      }
    }, 18000);
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.reconnectTimer) return;
    const baseDelay = Math.min(8000, 1000 * Math.pow(2, this.reconnectAttempts));
    const jitter = Math.floor(Math.random() * 350);
    this.reconnectAttempts = Math.min(this.reconnectAttempts + 1, 5);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.disposed) {
        this.connect();
      }
    }, baseDelay + jitter);
  }

  public nudgeReconnect(): void {
    if (this.disposed || this.subscribed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.connect();
  }

  public publish(topic: string, payloadStr: string): boolean {
    if (this.disposed || !this.subscribed || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.ws.send(buildMqttPublishPacket(topic, payloadStr));
      return true;
    } catch {
      return false;
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.subscribed = false;
    this.clearKeepAlive();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      // Avoid closing while CONNECTING so Chromium does not log a handshake failure console error
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.close(1000);
        } catch {
          // Ignore
        }
      }
    }
  }
}

class NetworkService {
  private mqttWssClient: NativeMqttWssClient | null = null;
  private ntfyEventSource: EventSource | null = null;
  private devEventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();

  private seenMsgIds: Set<string> = new Set();
  private seenMsgQueue: string[] = [];

  private hostOutbox: OutboxItem[] = [];
  private ctrlOutbox: OutboxItem[] = [];
  private pendingConnectCallbacks: PendingConnectCallback[] = [];

  private wssConnected = false;
  private ntfyConnected = false;
  private devSseConnected = false;
  private hasEverConnectedInSession = false;
  private initialSyncSent = false;
  private syncFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private hasReceivedStateFromHost = false;

  private ntfyBlockedUntil = 0;
  private outboundSeq = 0;
  private lastJoinKey = '';
  private lastJoinSentAt = 0;

  public myPeerId = '';
  public isHost = false;
  public roomCode = '';
  public connectionStatus: ConnectionStatus = 'offline';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.roomCode) return;
        this.mqttWssClient?.nudgeReconnect();
        if (!this.ntfyEventSource || this.ntfyEventSource.readyState === EventSource.CLOSED) {
          this.setupNtfyRelay(this.roomCode, this.isHost);
        }
        this.recomputeStatus();
      });

      window.addEventListener('offline', () => {
        this.wssConnected = false;
        this.ntfyConnected = false;
        this.recomputeStatus();
      });
    }
  }

  private ensurePeerId(rolePrefix: 'host' | 'joy'): string {
    if (!this.myPeerId || !this.myPeerId.startsWith(`${rolePrefix}-`)) {
      const rand = Math.random().toString(36).slice(2, 7);
      this.myPeerId = `${rolePrefix}-${Date.now().toString(36)}-${rand}`;
    }
    return this.myPeerId;
  }

  private isDevRelayAvailable(): boolean {
    const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    return Boolean(typeof window !== 'undefined' && metaEnv?.DEV);
  }

  private hasCrossDeviceTransport(): boolean {
    return this.wssConnected || this.ntfyConnected || this.devSseConnected;
  }

  private setConnectionStatus(next: ConnectionStatus): void {
    if (this.connectionStatus === next) return;
    this.connectionStatus = next;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(next);
      } catch (err) {
        console.warn('[NET] Status handler notice:', err);
      }
    });
  }

  private recomputeStatus(): void {
    if (!this.roomCode) {
      this.setConnectionStatus('offline');
      return;
    }

    if (this.hasCrossDeviceTransport()) {
      this.hasEverConnectedInSession = true;
      this.setConnectionStatus('connected');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.setConnectionStatus('offline');
      return;
    }

    this.setConnectionStatus(this.hasEverConnectedInSession ? 'reconnecting' : 'connecting');
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public initHost(roomCode: string, onReady?: (peerId: string) => void): void {
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) return;

    const hostPeerId = `sprint-party-host-${normalized}`;
    if (this.isHost && this.roomCode === normalized && (this.mqttWssClient || this.ntfyEventSource)) {
      onReady?.(hostPeerId);
      return;
    }

    this.cleanupSession();
    this.isHost = true;
    this.roomCode = normalized;
    this.ensurePeerId('host');
    this.recomputeStatus();

    this.startTransports(normalized, true);
    onReady?.(hostPeerId);
  }

  public initController(
    roomCode: string,
    onConnected?: () => void,
    onError?: (err: unknown) => void
  ): void {
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) return;

    this.ensurePeerId('joy');

    if (!this.isHost && this.roomCode === normalized && (this.mqttWssClient || this.ntfyEventSource)) {
      if (this.hasCrossDeviceTransport()) {
        if (onConnected) {
          queueMicrotask(() => onConnected());
        }
        return;
      }

      if (onConnected || onError) {
        this.registerConnectCallbacks(onConnected, onError);
      }
      this.mqttWssClient?.nudgeReconnect();
      return;
    }

    this.cleanupSession();
    this.isHost = false;
    this.roomCode = normalized;
    this.hasReceivedStateFromHost = false;
    this.recomputeStatus();

    if (onConnected || onError) {
      this.registerConnectCallbacks(onConnected, onError);
    }

    this.startTransports(normalized, false);
  }

  private registerConnectCallbacks(
    onConnected?: () => void,
    onError?: (err: unknown) => void
  ): void {
    const entry: PendingConnectCallback = {
      onConnected,
      onError,
      timer: setTimeout(() => {
        const idx = this.pendingConnectCallbacks.indexOf(entry);
        if (idx !== -1) {
          this.pendingConnectCallbacks.splice(idx, 1);
          entry.onError?.(new Error('Tiempo de espera agotado al conectar con la sala en la nube.'));
        }
      }, CONNECT_TIMEOUT_MS),
    };
    this.pendingConnectCallbacks.push(entry);
  }

  private resolvePendingConnectCallbacks(): void {
    if (this.pendingConnectCallbacks.length === 0) return;
    const callbacks = this.pendingConnectCallbacks.splice(0, this.pendingConnectCallbacks.length);
    callbacks.forEach((cb) => {
      clearTimeout(cb.timer);
      try {
        cb.onConnected?.();
      } catch (err) {
        console.warn('[NET] onConnected callback error:', err);
      }
    });
  }

  private startTransports(roomCode: string, isHost: boolean): void {
    this.setupCorefluxWss(roomCode, isHost);
    this.setupNtfyRelay(roomCode, isHost);
    this.setupBroadcastChannel(roomCode);
    if (this.isDevRelayAvailable()) {
      this.setupDevSSERelay(roomCode, isHost);
    }
  }

  private setupCorefluxWss(roomCode: string, isHost: boolean): void {
    if (typeof WebSocket === 'undefined') return;

    const listenTopic = isHost
      ? `${TOPIC_PREFIX}/${roomCode}/to-host`
      : `${TOPIC_PREFIX}/${roomCode}/to-controllers`;
    const clientId = `${isHost ? 'sp-h' : 'sp-c'}-${roomCode}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    this.mqttWssClient = new NativeMqttWssClient(COREFLUX_WSS_URL, clientId, listenTopic, {
      onSubscribed: () => {
        this.wssConnected = true;
        this.onCrossDeviceTransportReady();
      },
      onMessage: (payloadText) => {
        this.handleRawWirePayload(payloadText, 'wss-443');
      },
      onDisconnected: () => {
        this.wssConnected = false;
        this.recomputeStatus();
      },
    });
  }

  private setupNtfyRelay(roomCode: string, isHost: boolean): void {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;
    if (this.ntfyEventSource) {
      this.ntfyEventSource.close();
      this.ntfyEventSource = null;
    }

    const listenTopic = `${TOPIC_PREFIX}-${roomCode}-${isHost ? 'to-host' : 'to-controllers'}`;
    try {
      const es = new EventSource(`${NTFY_BASE_URL}/${encodeURIComponent(listenTopic)}/sse`);

      const markOpen = () => {
        if (this.ntfyEventSource !== es) return;
        const wasConnected = this.ntfyConnected;
        this.ntfyConnected = true;
        if (!wasConnected) {
          this.onCrossDeviceTransportReady();
        }
      };

      es.onopen = markOpen;
      es.addEventListener('open', markOpen);

      es.onmessage = (event: MessageEvent) => {
        if (this.ntfyEventSource !== es) return;
        try {
          const ntfyMsg = JSON.parse(event.data);
          if (ntfyMsg?.attachment?.url) {
            fetch(ntfyMsg.attachment.url)
              .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
              .then((text) => this.handleRawWirePayload(text, 'ntfy-attachment'))
              .catch(() => {});
            return;
          }
          if (ntfyMsg?.event === 'message' && typeof ntfyMsg.message === 'string') {
            this.handleRawWirePayload(ntfyMsg.message, 'ntfy-sse');
          }
        } catch {
          // Ignore non-JSON keepalive/control frames
        }
      };

      es.onerror = () => {
        if (this.ntfyEventSource !== es) return;
        this.ntfyConnected = false;
        this.recomputeStatus();
      };

      this.ntfyEventSource = es;
    } catch {
      this.ntfyConnected = false;
      this.recomputeStatus();
    }
  }

  private setupDevSSERelay(roomCode: string, isHost: boolean): void {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;
    if (this.devEventSource) {
      this.devEventSource.close();
      this.devEventSource = null;
    }

    try {
      const url = `/api/events?room=${encodeURIComponent(roomCode)}&role=${isHost ? 'host' : 'controller'}`;
      const es = new EventSource(url);

      es.onopen = () => {
        if (this.devEventSource !== es) return;
        this.devSseConnected = true;
        this.onCrossDeviceTransportReady();
      };

      es.onmessage = (event: MessageEvent) => {
        if (this.devEventSource !== es) return;
        this.handleRawWirePayload(event.data, 'vite-sse');
      };

      es.onerror = () => {
        if (this.devEventSource !== es) return;
        this.devSseConnected = false;
        this.recomputeStatus();
      };

      this.devEventSource = es;
    } catch {
      this.devSseConnected = false;
    }
  }

  private setupBroadcastChannel(roomCode: string): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.broadcastChannel = new BroadcastChannel(`sprint-party-channel-${roomCode}`);
    this.broadcastChannel.onmessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (typeof event.data === 'string') {
        this.handleRawWirePayload(event.data, 'broadcast');
      } else if (event.data && typeof event.data === 'object' && 'action' in event.data) {
        this.processEnvelope(event.data as WireEnvelope, 'broadcast');
      } else {
        this.dispatchAction(event.data as NetworkAction, 'broadcast');
      }
    };
  }

  private onCrossDeviceTransportReady(): void {
    this.recomputeStatus();
    this.flushOutboxes();
    this.resolvePendingConnectCallbacks();

    if (!this.isHost) {
      if (!this.initialSyncSent) {
        this.initialSyncSent = true;
        this.sendToHost({ type: 'REQUEST_SYNC' });

        // Safety fallback: if Host booted slightly later or first transport missed reply, request once more
        if (this.syncFallbackTimer) clearTimeout(this.syncFallbackTimer);
        this.syncFallbackTimer = setTimeout(() => {
          this.syncFallbackTimer = null;
          if (!this.isHost && !this.hasReceivedStateFromHost && this.hasCrossDeviceTransport()) {
            this.sendToHost({ type: 'REQUEST_SYNC' });
          }
        }, 1200);
      } else if (!this.hasReceivedStateFromHost) {
        this.sendToHost({ type: 'REQUEST_SYNC' });
      }
    }
  }

  private prepareOutgoingAction(action: NetworkAction): NetworkAction {
    if (action.type === 'SYNC_STATE' && action.state && Array.isArray(action.state.boardSpaces)) {
      const { boardSpaces: _stripped, ...restState } = action.state;
      return {
        type: 'SYNC_STATE',
        state: restState as GameState,
      };
    }
    return action;
  }

  private hydrateIncomingAction(action: NetworkAction): NetworkAction {
    if (action.type === 'SYNC_STATE' && action.state && !action.state.boardSpaces) {
      return {
        type: 'SYNC_STATE',
        state: {
          ...action.state,
          boardSpaces: BOARD_SPACES,
        },
      };
    }
    return action;
  }

  private buildEnvelope(action: NetworkAction): WireEnvelope {
    const rolePrefix = this.isHost ? 'host' : 'joy';
    const senderId = this.ensurePeerId(rolePrefix);
    const seq = ++this.outboundSeq;
    return {
      msgId: `${senderId}:${seq}:${Date.now().toString(36)}`,
      room: this.roomCode,
      senderId,
      action: this.prepareOutgoingAction(action),
    };
  }

  private rememberMsgId(msgId: string): boolean {
    if (this.seenMsgIds.has(msgId)) return false;
    this.seenMsgIds.add(msgId);
    this.seenMsgQueue.push(msgId);
    if (this.seenMsgQueue.length > DEDUP_MAX_SIZE) {
      const oldest = this.seenMsgQueue.shift();
      if (oldest) this.seenMsgIds.delete(oldest);
    }
    return true;
  }

  private handleRawWirePayload(rawText: string, source: string): void {
    try {
      const parsed = JSON.parse(rawText);
      if (!parsed || typeof parsed !== 'object') return;
      if ('action' in parsed) {
        this.processEnvelope(parsed as WireEnvelope, source);
      }
    } catch {
      // Ignore malformed payloads
    }
  }

  private processEnvelope(envelope: WireEnvelope, source: string): void {
    if (!envelope || !envelope.action) return;
    if (envelope.room && this.roomCode && envelope.room.toUpperCase() !== this.roomCode) return;
    if (envelope.senderId && envelope.senderId === this.myPeerId) return;
    if (envelope.msgId && !this.rememberMsgId(envelope.msgId)) return;

    const hydrated = this.hydrateIncomingAction(envelope.action);
    if (hydrated.type === 'SYNC_STATE') {
      this.hasReceivedStateFromHost = true;
    }
    this.dispatchAction(hydrated, envelope.senderId || source);
  }

  private dispatchAction(action: NetworkAction, senderId?: string): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(action, senderId);
      } catch (err) {
        console.error('[NET] Message handler error:', err);
      }
    });
  }

  private postToNtfy(direction: 'to-host' | 'to-controllers', bodyStr: string): void {
    if (typeof window === 'undefined' || Date.now() < this.ntfyBlockedUntil) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const topic = `${TOPIC_PREFIX}-${this.roomCode}-${direction}`;
    fetch(`${NTFY_BASE_URL}/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: bodyStr,
    })
      .then((res) => {
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after')) || 30;
          this.ntfyBlockedUntil = Date.now() + retryAfter * 1000;
          return;
        }
        const rateHeader = res.headers.get('ratelimit') || '';
        const reqMatch = rateHeader.match(/"requests";r=(\d+);t=(\d+)/);
        if (reqMatch) {
          const remaining = Number(reqMatch[1]);
          const resetSec = Number(reqMatch[2]);
          if (remaining <= 2) {
            this.ntfyBlockedUntil = Date.now() + Math.max(5, resetSec + 1) * 1000;
          }
        }
      })
      .catch(() => {
        // Ignore transient network errors; Coreflux WSS or retries cover delivery
      });
  }

  private postToDevRelay(bodyStr: string): void {
    if (!this.isDevRelayAvailable()) return;
    fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    }).catch(() => {});
  }

  private transmitEnvelope(
    direction: 'to-host' | 'to-controllers',
    item: OutboxItem
  ): void {
    const serialized = JSON.stringify(item.envelope);

    // 1. Port-443 WSS MQTT relay
    const mqttTopic = `${TOPIC_PREFIX}/${this.roomCode}/${direction}`;
    this.mqttWssClient?.publish(mqttTopic, serialized);

    // 2. Port-443 HTTPS ntfy.sh relay (skip rapid tap bursts if WSS is already up to conserve quota)
    if (!item.skipNtfyIfWssConnected || !this.wssConnected) {
      this.postToNtfy(direction, serialized);
    }

    // 3. Vite dev server local relay (DEV mode only — zero 404s on static preview/Netlify)
    this.postToDevRelay(serialized);
  }

  private enqueueOutbox(queue: OutboxItem[], item: OutboxItem, direction: 'to-host' | 'to-controllers'): void {
    if (direction === 'to-controllers' && item.envelope.action.type === 'SYNC_STATE') {
      // Keep only the latest SYNC_STATE snapshot while offline/connecting
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].envelope.action.type === 'SYNC_STATE') {
          queue.splice(i, 1);
        }
      }
    } else if (direction === 'to-host' && item.envelope.action.type === 'REQUEST_SYNC') {
      if (queue.some((q) => q.envelope.action.type === 'REQUEST_SYNC')) {
        return;
      }
    }

    queue.push(item);
    if (queue.length > OUTBOX_MAX_SIZE) {
      queue.shift();
    }
  }

  private flushOutboxes(): void {
    if (!this.hasCrossDeviceTransport()) return;

    if (this.hostOutbox.length > 0) {
      const pending = this.hostOutbox.splice(0, this.hostOutbox.length);
      pending.forEach((item) => this.transmitEnvelope('to-host', item));
    }

    if (this.ctrlOutbox.length > 0) {
      const pending = this.ctrlOutbox.splice(0, this.ctrlOutbox.length);
      pending.forEach((item) => this.transmitEnvelope('to-controllers', item));
    }
  }

  public sendToHost(action: NetworkAction): void {
    if (!this.roomCode) return;

    // Coalesce identical back-to-back JOIN_ROOM calls within 350ms
    if (action.type === 'JOIN_ROOM') {
      const joinKey = `${this.roomCode}:${action.player.id || ''}:${action.player.characterId}:${action.player.name}`;
      const now = Date.now();
      if (joinKey === this.lastJoinKey && now - this.lastJoinSentAt < 350) {
        return;
      }
      this.lastJoinKey = joinKey;
      this.lastJoinSentAt = now;
    }

    const envelope = this.buildEnvelope(action);
    const skipNtfyIfWssConnected = action.type === 'SUBMIT_MINIGAME_TAP';
    const item: OutboxItem = { envelope, skipNtfyIfWssConnected };

    // Always send immediately over BroadcastChannel for instant same-browser multi-tab sync
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(envelope);
      } catch {
        // Ignore
      }
    }

    if (this.hasCrossDeviceTransport()) {
      this.transmitEnvelope('to-host', item);
    } else {
      this.enqueueOutbox(this.hostOutbox, item, 'to-host');
    }
  }

  public broadcastToControllers(action: NetworkAction): void {
    if (!this.roomCode) return;

    const envelope = this.buildEnvelope(action);
    const isMinigameTick =
      action.type === 'SYNC_STATE' && action.state?.phase === 'minigame' && action.state?.minigame?.type === 'block_smash';
    const item: OutboxItem = { envelope, skipNtfyIfWssConnected: isMinigameTick };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(envelope);
      } catch {
        // Ignore
      }
    }

    if (this.hasCrossDeviceTransport()) {
      this.transmitEnvelope('to-controllers', item);
    } else {
      this.enqueueOutbox(this.ctrlOutbox, item, 'to-controllers');
    }
  }

  private cleanupSession(): void {
    if (this.syncFallbackTimer) {
      clearTimeout(this.syncFallbackTimer);
      this.syncFallbackTimer = null;
    }

    this.pendingConnectCallbacks.forEach((cb) => clearTimeout(cb.timer));
    this.pendingConnectCallbacks = [];

    if (this.mqttWssClient) {
      this.mqttWssClient.dispose();
      this.mqttWssClient = null;
    }
    if (this.ntfyEventSource) {
      this.ntfyEventSource.close();
      this.ntfyEventSource = null;
    }
    if (this.devEventSource) {
      this.devEventSource.close();
      this.devEventSource = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.wssConnected = false;
    this.ntfyConnected = false;
    this.devSseConnected = false;
    this.hasEverConnectedInSession = false;
    this.initialSyncSent = false;
    this.hasReceivedStateFromHost = false;
    this.hostOutbox = [];
    this.ctrlOutbox = [];
  }

  public disconnect(): void {
    this.cleanupSession();
    this.roomCode = '';
    this.setConnectionStatus('offline');
  }
}

export const network = new NetworkService();
