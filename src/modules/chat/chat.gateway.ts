import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto, CreateSessionDto } from './dto/chat.dto';
import { DifyChunk } from '../dify/dto/dify.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/ws/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // 维护每个会话的订阅客户端
  private sessionClients: Map<string, Set<string>> = new Map();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // 移除该客户端订阅的所有会话
    this.sessionClients.forEach((clients, sessionId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        this.logger.log(`Client ${client.id} removed from session ${sessionId}`);
      }
    });
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody('sessionId') sessionId: string,
  ) {
    this.logger.log(`Client ${client.id} joining session: ${sessionId}`);

    // 验证会话存在
    try {
      await this.chatService.getSession(sessionId);
    } catch (error) {
      this.logger.error(`Session not found: ${sessionId}`);
      return { success: false, error: 'Session not found' };
    }

    // 添加到会话订阅列表
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId)!.add(client.id);

    return { success: true, sessionId };
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody('sessionId') sessionId: string,
  ) {
    this.logger.log(`Client ${client.id} leaving session: ${sessionId}`);

    const clients = this.sessionClients.get(sessionId);
    if (clients) {
      clients.delete(client.id);
    }

    return { success: true, sessionId };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string; inputs?: any },
  ) {
    const { sessionId, message, inputs } = data;
    this.logger.log(`Message from client ${client.id}, session: ${sessionId}`);

    // 流式回调：将分片广播给订阅的客户端
    const onChunk = (chunk: DifyChunk) => {
      this.broadcastToSession(sessionId, 'message-chunk', {
        event: chunk.event,
        answer: chunk.answer,
        conversationId: chunk.conversation_id,
      });
    };

    try {
      const dto: SendMessageDto = {
        message,
        inputs,
      };

      const result = await this.chatService.sendMessage(sessionId, dto, onChunk);

      // 广播完成消息给订阅的客户端
      this.broadcastToSession(sessionId, 'message-complete', result);

      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 向指定会话的所有订阅客户端广播消息
  private broadcastToSession(sessionId: string, event: string, data: any) {
    const clients = this.sessionClients.get(sessionId);
    if (!clients || clients.size === 0) {
      return;
    }

    const message = JSON.stringify(data);
    clients.forEach((clientId) => {
      this.server.to(clientId).emit(event, data);
    });
  }
}