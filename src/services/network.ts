import Peer, { DataConnection } from 'peerjs';
import { NetworkAction } from '@/types/game';

type MessageHandler = (action: NetworkAction, peerId?: string) => void;

class NetworkService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  public myPeerId: string = '';
  public isHost: boolean = false;
  public roomCode: string = '';

  // Initialize Host TV
  public initHost(roomCode: string, onReady: (peerId: string) => void): void {
    this.isHost = true;
    this.roomCode = roomCode.toUpperCase();
    const hostPeerId = `sprint-party-host-${this.roomCode}`;

    // 1. Setup BroadcastChannel fallback for multi-tab local testing
    this.setupBroadcastChannel(this.roomCode);

    // 2. Setup PeerJS
    try {
      this.peer = new Peer(hostPeerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        onReady(id);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
        });

        conn.on('data', (data) => {
          this.handleIncomingData(data as NetworkAction, conn.peer);
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host warning:', err);
      });
    } catch (e) {
      console.warn('PeerJS initialization error, using BroadcastChannel:', e);
    }
  }

  // Initialize Player Joy-Phone Controller
  public initController(roomCode: string, onConnected: () => void, onError: (err: any) => void): void {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase();
    const hostPeerId = `sprint-party-host-${this.roomCode}`;

    // 1. Setup BroadcastChannel
    this.setupBroadcastChannel(this.roomCode);

    // 2. Setup PeerJS
    try {
      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        const conn = this.peer!.connect(hostPeerId, { reliable: true });

        conn.on('open', () => {
          this.hostConnection = conn;
          onConnected();
        });

        conn.on('data', (data) => {
          this.handleIncomingData(data as NetworkAction, conn.peer);
        });

        conn.on('error', (err) => {
          onError(err);
        });
      });

      this.peer.on('error', (err) => {
        onError(err);
      });
    } catch (e) {
      console.warn('PeerJS controller connection error:', e);
    }
  }

  private setupBroadcastChannel(roomCode: string): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
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
    // Via WebRTC peer
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(action);
    }
    // Also via BroadcastChannel for instant local tab sync
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(action);
    }
  }

  // Broadcast state to all connected Joy-Phones (from Host TV)
  public broadcastToControllers(action: NetworkAction): void {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(action);
      }
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(action);
    }
  }

  public disconnect(): void {
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
