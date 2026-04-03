import { io, Socket } from 'socket.io-client';
import type { SendMessageRequest } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  // 连接 WebSocket
  connect(url?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    try {
      const socketUrl = url || import.meta.env.VITE_WS_URL?.replace('http', 'ws') || 'ws://localhost:3000';

      this.socket = io(socketUrl, {
        path: '/ws/chat',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        if (this.sessionId) {
          this.joinSession(this.sessionId);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      throw error;
    }
  }

  // 订阅会话
  joinSession(sessionId: string) {
    this.sessionId = sessionId;
    if (this.socket?.connected) {
      this.socket.emit('join-session', { sessionId });
    }
  }

  // 取消订阅
  leaveSession() {
    if (this.socket?.connected && this.sessionId) {
      this.socket.emit('leave-session', { sessionId: this.sessionId });
      this.sessionId = null;
    }
  }

  // 发送消息
  sendMessage(sessionId: string, message: string, inputs?: SendMessageRequest['inputs']) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.emit('send-message', { sessionId, message, inputs });
  }

  // 监听消息
  onMessage(callback: (data: any) => void) {
    this.socket?.on('message-complete', callback);
  }

  // 监听消息分片
  onMessageChunk(callback: (data: any) => void) {
    this.socket?.on('message-chunk', callback);
  }

  // 监听转人工状态
  onHandoffStatus(callback: (data: any) => void) {
    this.socket?.on('handoff-status', callback);
  }

  // 移除监听
  offMessage(callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off('message-complete', callback);
    } else {
      this.socket?.off('message-complete');
    }
  }

  offMessageChunk(callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off('message-chunk', callback);
    } else {
      this.socket?.off('message-chunk');
    }
  }

  offHandoffStatus(callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off('handoff-status', callback);
    } else {
      this.socket?.off('handoff-status');
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.leaveSession();
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // 获取当前会话ID
  getSessionId(): string | null {
    return this.sessionId;
  }
}

export const socketService = new SocketService();
export default socketService;