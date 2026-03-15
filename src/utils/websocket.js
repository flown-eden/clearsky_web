// WebSocket service for STOMP (Native) real-time communication
import { Client } from '@stomp/stompjs';
import { useUserStore } from '@/stores/user';

class WebSocketService {
  constructor() {
    this.client = null;
    this.messageHandlers = new Map(); // Map<string, Function[]>
    this.isConnected = false;
    this.subscriptions = new Map(); // Map<string, StompSubscription>
    this.reconnectTimer = null;
    this.maxRetries = 5;
    this.retryCount = 0;
  }

  // Initialize and connect
  connect() {
    const userStore = useUserStore();
    const token = userStore.token;

    if (!token) {
      console.warn("WS: No token available, skipping connection.");
      return;
    }

    // Deactivate existing client if any
    if (this.client) {
      this.client.deactivate();
    }

    // Configure STOMP client
    this.client = new Client({
      // Use native WebSocket
      brokerURL: 'ws://localhost:8080/ws',
      
      // Connection headers (for STOMP CONNECT frame)
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      // Debug logging
      debug: (str) => {
        // console.log('WS Debug:', str);
      },

      // Heartbeat configuration (incoming/outgoing in ms)
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      // Auto reconnect delay
      reconnectDelay: 5000,

      onConnect: (frame) => {
        console.log("WS: Connected via Native STOMP");
        this.isConnected = true;
        this.retryCount = 0;
        this.notify('CONNECTED', { status: 'connected', frame });
        
        // Resubscribe to existing topics if any
        this.resubscribeAll();
      },

      onStompError: (frame) => {
        console.error('WS: Broker reported error: ' + frame.headers['message']);
        console.error('WS: Additional details: ' + frame.body);
      },

      onWebSocketClose: () => {
        console.log("WS: Connection closed");
        this.isConnected = false;
        this.notify('DISCONNECTED', { status: 'disconnected' });
      }
    });

    // Start connection
    this.client.activate();
  }

  // Disconnect
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
      this.subscriptions.clear();
      console.log("WS: Disconnected manually");
    }
  }

  // Subscribe to a topic
  subscribe(topic, callback) {
    if (!this.client || !this.isConnected) {
      // Queue subscription or wait for connection
      console.warn("WS: Not connected, cannot subscribe immediately. Will retry on connect.");
    }

    // Check if already subscribed to this topic
    if (this.subscriptions.has(topic)) {
      // Already subscribed, maybe we should update the callback?
      // For simplicity, we assume one subscription per topic.
      // If we want to support multiple listeners, we need a list of callbacks.
      // But STOMP subscription object is unique.
      // Let's just log and return.
      // console.log(`WS: Already subscribed to ${topic}`);
    }

    // Store callback for this topic
    // Note: STOMP subscription returns an object with unsubscribe() method
    if (this.isConnected) {
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (e) {
          console.error("WS: JSON Parse error", e);
          callback(message.body); // Fallback to raw string
        }
      });
      this.subscriptions.set(topic, sub);
      console.log(`WS: Subscribed to ${topic}`);
    } else {
      // Store intent for resubscription on connect
      this.pendingSubscriptions = this.pendingSubscriptions || [];
      // Avoid duplicate pending subscriptions
      if (!this.pendingSubscriptions.find(s => s.topic === topic)) {
          this.pendingSubscriptions.push({ topic, callback });
      }
    }
  }
  
  // Helper to subscribe to specific conversation
  subscribeToConversation(conversationId, callback) {
      const topic = `/topic/conversations/${conversationId}`;
      this.subscribe(topic, callback);
      return topic; // Return topic for unsubscription
  }

  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`WS: Unsubscribed from ${topic}`);
    }
  }

  resubscribeAll() {
    // Handle pending subscriptions
    if (this.pendingSubscriptions) {
      this.pendingSubscriptions.forEach(({ topic, callback }) => {
        this.subscribe(topic, callback);
      });
      this.pendingSubscriptions = [];
    }
  }

  // Internal event notification (for connection status, etc.)
  on(type, callback) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(callback);
  }

  notify(type, payload) {
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(cb => cb(payload));
    }
  }
}

const wsService = new WebSocketService();
export default wsService;
