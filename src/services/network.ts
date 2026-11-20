import Peer, { DataConnection } from 'peerjs';
import mqtt, { MqttClient } from 'mqtt';
import { NetworkAction } from '@/types/game';

type MessageHandler = (action: NetworkAction, peerId?: string) => void;

class NetworkService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private mqttClient: MqttClient | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  public myPeerId: string = '';
  public isHost: boolean = false;
  public roomCode: string = '';

  // Initialize Host TV
  public initHost(roomCode: string, onReady: (peerId: string) => void): void {
    this.isHost = true;
    this.roomCode = roomCode.toUpperCase();
    const hostPeerId = `sprint-party-host-${this.roomCode}`;
    this.myPeerId = hostPeerId;

    // 1. Setup Global MQTT Cloud Relay (Works everywhere: Netlify, 4G, University Wi-Fi)
    this.setupMQTT(this.roomCode, true);

    // 2. Setup local SSE relay (for local Vite dev testing)
    this.setupSSERelay(this.roomCode, true);

    // 3. Setup BroadcastChannel fallback for multi-tab local testing
    this.setupBroadcastChannel(this.roomCode);

    // Immediately trigger onReady
    onReady(hostPeerId);

    // 4. Setup PeerJS (optional cloud P2P backup)
    try {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.id === hostPeerId) {
          return; // Already bound
        }
        this.peer.destroy();
      }

      this.peer = new Peer(hostPeerId, { debug: 1 });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
          this.handleIncomingData({ type: 'PEER_CONNECTED', peerId: conn.peer }, conn.peer);
        });

        conn.on('data', (data) => {
          this.handleIncomingData(data as NetworkAction, conn.peer);
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host notice (MQTT/SSE relay is active):', err);
      });
    } catch (e) {
      console.warn('PeerJS initialization notice (MQTT/SSE relay is active):', e);
    }
  }

  // Initialize Player Joy-Phone Controller
  public initController(roomCode: string, onConnected: () => void, onError: (err: any) => void): void {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase();
    const hostPeerId = `sprint-party-host-${this.roomCode}`;
    if (!this.myPeerId) {
      this.myPeerId = `joy-phone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    // 1. Setup Global MQTT Cloud Relay (Works everywhere: Netlify, 4G, University Wi-Fi)
    this.setupMQTT(this.roomCode, false);

    // 2. Setup local SSE relay
    this.setupSSERelay(this.roomCode, false);

    // 3. Setup BroadcastChannel
    this.setupBroadcastChannel(this.roomCode);

    // Immediately notify connected because MQTT/SSE are active
    onConnected();
    this.sendToHost({ type: 'REQUEST_SYNC' });

    // 4. Setup PeerJS
    try {
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        const conn = this.peer!.connect(hostPeerId, { reliable: true });

        conn.on('open', () => {
          this.hostConnection = conn;
          this.sendToHost({ type: 'REQUEST_SYNC' });
        });

        conn.on('data', (data) => {
          this.handleIncomingData(data as NetworkAction, conn.peer);
        });

        conn.on('error', (err) => {
          console.warn('PeerJS connection notice (MQTT/SSE relay is active):', err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS controller notice (MQTT/SSE relay is active):', err);
      });
    } catch (e) {
      console.warn('PeerJS controller notice (MQTT/SSE relay is active):', e);
    }
  }

  // Global Cloud Real-Time Relay (Zero-server, Works on Netlify, mobile 4G/5G, university Wi-Fi)
  private setupMQTT(roomCode: string, isHost: boolean): void {
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch (e) {}
      this.mqttClient = null;
    }

    try {
      // Use EMQX public high-speed WebSocket broker over standard WSS
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
      const client = mqtt.connect(brokerUrl, {
        clientId: `${isHost ? 'host' : 'ctrl'}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 4000,
      });

      const hostTopic = `sprint-party-retro-v2/${roomCode}/to-host`;
      const ctrlTopic = `sprint-party-retro-v2/${roomCode}/to-controllers`;

      client.on('connect', () => {
        console.log(`[MQTT-CLOUD] Connected to public relay (${brokerUrl}) as ${isHost ? 'Host' : 'Controller'}`);
        const topicToListen = isHost ? hostTopic : ctrlTopic;
        client.subscribe(topicToListen, { qos: 1 }, (err) => {
          if (!err) {
            console.log(`[MQTT-CLOUD] Subscribed to topic: ${topicToListen}`);
            if (!isHost) {
              this.sendToHost({ type: 'REQUEST_SYNC' });
            }
          }
        });
      });

      client.on('message', (_topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          if (payload && payload.action) {
            if (payload.senderId && payload.senderId === this.myPeerId) return;
            this.handleIncomingData(payload.action as NetworkAction, payload.senderId || 'mqtt');
          }
        } catch (e) {
          console.warn('[MQTT-CLOUD] Message parse error:', e);
        }
      });

      client.on('error', (err) => {
        console.warn('[MQTT-CLOUD] Notice:', err);
      });

      this.mqttClient = client;
    } catch (e) {
      console.warn('[MQTT-CLOUD] Setup error:', e);
    }
  }

  private setupSSERelay(roomCode: string, isHost: boolean): void {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      try {
        const url = `/api/events?room=${encodeURIComponent(roomCode)}&role=${isHost ? 'host' : 'controller'}`;
        const es = new EventSource(url);

        es.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload && payload.action) {
              // Ignore echo of own messages
              if (payload.senderId && payload.senderId === this.myPeerId) return;
              this.handleIncomingData(payload.action as NetworkAction, payload.senderId || 'sse');
            }
          } catch {
            // Ignore non-json chunks
          }
        };

        es.onerror = () => {
          // EventSource automatically attempts reconnection
        };

        this.eventSource = es;
      } catch (e) {
        console.warn('SSE relay connection error:', e);
      }
    }
  }

  private setupBroadcastChannel(roomCode: string): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
      }
      this.broadcastChannel = new BroadcastChannel(`sprint-party-channel-${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data) {
          this.handleIncomingData(event.data as NetworkAction, 'local-channel');
        }
      };
    }
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private handleIncomingData(action: NetworkAction, senderId?: string): void {
    this.messageHandlers.forEach((handler) => handler(action, senderId));
  }

  // Send message to Host (from controller)
  public sendToHost(action: NetworkAction): void {
    const payload = JSON.stringify({
      room: this.roomCode,
      action,
      senderId: this.myPeerId || 'controller',
    });

    // 1. MQTT Cloud Relay (Works everywhere on Netlify, 4G, and university Wi-Fi)
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(`sprint-party-retro-v2/${this.roomCode}/to-host`, payload, { qos: 1 });
    }

    // 2. HTTP message relay (LAN/Wi-Fi to local Vite dev server)
    if (typeof window !== 'undefined') {
      fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {});
    }

    // 3. WebRTC peer (P2P direct)
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(action);
    }

    // 4. BroadcastChannel for instant local tab sync
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(action);
    }
  }

  // Broadcast state to all connected Joy-Phones (from Host TV)
  public broadcastToControllers(action: NetworkAction): void {
    const payload = JSON.stringify({
      room: this.roomCode,
      action,
      senderId: this.myPeerId || 'host',
    });

    // 1. MQTT Cloud Relay (Broadcasts to all phones across Netlify, 4G, and Wi-Fi)
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(`sprint-party-retro-v2/${this.roomCode}/to-controllers`, payload, { qos: 1 });
    }

    // 2. HTTP message relay
    if (typeof window !== 'undefined') {
      fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {});
    }

    // 3. WebRTC connections
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(action);
      }
    });

    // 4. BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(action);
    }
  }

  public disconnect(): void {
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch (e) {}
      this.mqttClient = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.hostConnection = null;
  }
}

export const network = new NetworkService();
