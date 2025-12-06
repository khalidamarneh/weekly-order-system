// src/services/socket.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this._isConnected = false;
    this._isConnecting = false;
    this.connectionPromise = null;

    this.lastJoinedRooms = [];
    
    // ✅ ADDED: Environment-based logging control
    this._isDevelopment = process.env.NODE_ENV === 'development';
  }

  // ----------------------------
  // SECURE LOGGING METHODS
  // ----------------------------
  
  // ✅ SECURE: Development-only logging
  _log(message, data = null) {
    if (this._isDevelopment) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  // ✅ SECURE: Development-only warnings
  _warn(message, data = null) {
    if (this._isDevelopment) {
      if (data) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  }

  // ✅ SECURE: Always log errors (but sanitize sensitive data)
  _error(message, error = null) {
    if (error && error.message) {
      // Sanitize error messages to avoid exposing sensitive data
      const sanitizedMessage = message.replace(/user\s*\d+/gi, 'user [REDACTED]')
                                     .replace(/client\s*\d+/gi, 'client [REDACTED]')
                                     .replace(/id\s*\d+/gi, 'id [REDACTED]');
      console.error(sanitizedMessage, this._sanitizeError(error));
    } else {
      console.error(message);
    }
  }

  // ✅ SECURE: Sanitize error objects
  _sanitizeError(error) {
    if (!error) return error;
    
    const sanitized = { ...error };
    // Remove any potentially sensitive data from error objects
    delete sanitized.config;
    delete sanitized.request;
    delete sanitized.response;
    
    if (sanitized.message) {
      sanitized.message = sanitized.message
        .replace(/user\s*\d+/gi, 'user [REDACTED]')
        .replace(/client\s*\d+/gi, 'client [REDACTED]')
        .replace(/id\s*\d+/gi, 'id [REDACTED]');
    }
    
    return sanitized;
  }

  // ----------------------------
  // TOKEN MANAGEMENT
  // ----------------------------
  
  getSocketToken() {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('socket_token');
      if (storedToken) {
        return storedToken;
      }
      
      const cookies = document.cookie.split(';');
      const socketTokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('socket_token=')
      );
      if (socketTokenCookie) {
        const token = socketTokenCookie.split('=')[1];
        localStorage.setItem('socket_token', token);
        return token;
      }
    }
    
    return null;
  }

  storeSocketToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('socket_token', token);
    }
  }

  clearSocketToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('socket_token');
    }
  }

  // ----------------------------
  // CONNECT (SILENT VERSION)
  // ----------------------------
  async connect() {
    if (this._isConnected) return this.socket;
    if (this._isConnecting && this.connectionPromise) return this.connectionPromise;

    this._isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this._log("🔄 Connecting to WebSocket server..."); // Dev only

      const socketToken = this.getSocketToken();

      this.socket = io("/", {
        transports: ["websocket"],
        withCredentials: true,
        auth: {
          token: socketToken
        },
        query: socketToken ? { token: socketToken } : {},
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 10000,
        forceNew: false,
        autoConnect: true
      });

      this.socket.on("connect", () => {
        this._log("✅ Socket connected securely"); // Dev only
        this._isConnected = true;
        this._isConnecting = false;

        // Re-join rooms silently
        this.lastJoinedRooms.forEach((room) => {
          this.socket.emit(room.event, room.data);
        });

        resolve(this.socket);
        this.connectionPromise = null;
      });

      this.socket.on("connect_error", (err) => {
        this._error("❌ Socket connection error:", err); // Always log errors (sanitized)
        this._isConnected = false;
        this._isConnecting = false;
        
        if (err.message.includes('auth') || err.message.includes('Authentication')) {
          this._warn('🔐 Authentication failed, clearing token...'); // Dev only
          this.clearSocketToken();
        }
        
        reject(err);
        this.connectionPromise = null;
      });

      this.socket.on("disconnect", (reason) => {
        this._warn("⚠️ Socket disconnected:", reason); // Dev only
        this._isConnected = false;
        this._isConnecting = false;
        
        if (reason === 'io server disconnect') {
          this._warn('🔐 Server disconnected socket'); // Dev only
        }
      });

      this.socket.on("auth_error", (data) => {
        this._error('🔐 Authentication error from server:', data); // Always log errors
        this.clearSocketToken();
        this.disconnect();
      });

      this.socket.on("token_expired", () => {
        this._warn('🔐 Token expired, reconnecting...'); // Dev only
        this.clearSocketToken();
        this.disconnect();
      });
    });

    return this.connectionPromise;
  }

  // ----------------------------
  // DISCONNECT
  // ----------------------------
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected = false;
      this._isConnecting = false;
      this.connectionPromise = null;
      this.lastJoinedRooms = [];
      this._log("🔌 Socket disconnected manually"); // Dev only
    }
  }

  async secureReconnect() {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.connect();
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this._isConnected;
  }

  // ----------------------------
  // ROOM JOINING (SILENT VERSION)
  // ----------------------------

  addRoom(event, data) {
    if (!this.lastJoinedRooms.find((r) => r.event === event && r.data === data)) {
      this.lastJoinedRooms.push({ event, data });
    }
  }

  joinClientRoom(clientId) {
    if (!this._isConnected) {
      this._warn("⚠️ Cannot join — not connected"); // Dev only
      return;
    }
    this.socket.emit("join-client-room", clientId);
    this.addRoom("join-client-room", clientId);
    this._log(`🎯 Joined client room`); // ✅ REMOVED: client ID from log
  }

  joinAdminRoom() {
    if (!this._isConnected) {
      this._warn("⚠️ Cannot join — not connected"); // Dev only
      return;
    }
    this.socket.emit("join-admin-room");
    this.addRoom("join-admin-room", null);
    this._log("🎯 Joined admin room"); // Dev only
  }

  joinPublicRoom(userId) {
    if (!this._isConnected) {
      this._warn("⚠️ Cannot join — not connected"); // Dev only
      return;
    }
    this.socket.emit("join-public-room", userId);
    this.addRoom("join-public-room", userId);
    this._log(`🎯 Joined public user room`); // ✅ REMOVED: user ID from log
  }

  async waitForConnection() {
    if (this._isConnected) return true;
    return new Promise((resolve) => {
      const check = () => {
        if (this._isConnected) resolve(true);
        else setTimeout(check, 50);
      };
      check();
    });
  }

  async healthCheck() {
    if (!this._isConnected) return false;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      this.socket.emit('ping', { timestamp: Date.now() }, (response) => {
        clearTimeout(timeout);
        resolve(response && response.pong === true);
      });
    });
  }

  // ✅ ADDED: Get connection status for debugging (no sensitive data)
  getStatus() {
    return {
      connected: this._isConnected,
      connecting: this._isConnecting,
      roomCount: this.lastJoinedRooms.length
      // ✅ No user IDs or sensitive data exposed
    };
  }
}

export default new SocketService();