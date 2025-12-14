/**
 * WebSocket Client Wrapper
 * Thay thế Socket.IO với WebSocket thuần (TCP-based)
 * Giữ API tương tự Socket.IO để dễ migrate
 */

export class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.listeners = new Map(); // {event: [callbacks]}
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.reconnectionAttempts || 10;
    this.reconnectDelay = options.reconnectionDelay || 1000;
    this.reconnectDelayMax = options.reconnectionDelayMax || 5000;
    this.timeout = options.timeout || 20000;
    this.connected = false;
    this.id = null; // Socket ID (tự generate)
    this.query = options.query || {};
    this.autoConnect = options.autoConnect !== false;

    // Generate unique socket ID
    this.id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (this.autoConnect) {
      this.connect();
    }
  }

  /**
   * Kết nối WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Convert HTTP URL to WebSocket URL
    let wsUrl = this.url;
    if (wsUrl.startsWith("http://")) {
      wsUrl = wsUrl.replace("http://", "ws://");
    } else if (wsUrl.startsWith("https://")) {
      wsUrl = wsUrl.replace("https://", "wss://");
    } else if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      // Default to ws:// if no protocol
      wsUrl = `ws://${wsUrl}`;
    }

    // Build WebSocket URL với query params
    const queryString = new URLSearchParams(this.query).toString();
    wsUrl = `${wsUrl}${queryString ? `?${queryString}` : ""}`;

    console.log("🔌 Connecting to WebSocket:", wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      // Connection timeout
      const timeoutId = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          this.emit("connect_error", new Error("Connection timeout"));
        }
      }, this.timeout);

      this.ws.onopen = () => {
        clearTimeout(timeoutId);
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log("✅ WebSocket connected, ID:", this.id);
        this.trigger("connect");
        
        // Start ping interval
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("❌ WebSocket error:", error);
        this.trigger("connect_error", error);
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeoutId);
        this.connected = false;
        this.stopPing();
        console.log("📴 WebSocket disconnected:", event.code, event.reason);
        this.trigger("disconnect", event.reason || "Connection closed");

        // Auto-reconnect nếu không phải manual close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.reconnectDelayMax
          );
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          this.trigger("reconnect_attempt", this.reconnectAttempts);
          setTimeout(() => this.connect(), delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.trigger("reconnect_failed");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.emit("connect_error", error);
    }
  }

  /**
   * Xử lý message từ server
   */
  handleMessage(data) {
    const { type, event, payload } = data;

    if (type === "event" && event) {
      // Trigger event với payload
      this.trigger(event, payload);
    } else if (type === "socketId") {
      // Server gửi socket ID
      this.id = payload;
    } else if (type === "pong") {
      // Pong response từ server
      this.lastPong = Date.now();
    }
  }

  /**
   * Gửi message lên server
   */
  send(type, event, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, event, payload });
      this.ws.send(message);
    } else {
      console.warn("WebSocket not connected, cannot send:", event);
    }
  }

  /**
   * Emit event (gửi lên server)
   */
  emit(event, payload) {
    this.send("event", event, payload);
  }

  /**
   * Lắng nghe event từ server
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Bỏ lắng nghe event
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Xóa tất cả listeners
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Trigger event internally (gọi callbacks) - dùng cho events từ server
   */
  trigger(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Disable auto-reconnect
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }
  }

  /**
   * Ping để keep connection alive
   */
  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000); // Ping mỗi 25 giây
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get connection state
   */
  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

/**
 * Factory function để tạo WebSocket client (tương tự io())
 */
export function createWebSocket(url, options = {}) {
  return new WebSocketClient(url, options);
}

