import { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { createSession, sendMessage, handoff, getMessages, updateSessionStatus } from '../services/api';
import type { CreateSessionRequest } from '../types';
import { formatAssistantMessage } from '../utils/formatMessage';

// 转换 markdown 表格为普通文本（使用新的格式化工具）
function convertMarkdownToText(content: string): string {
  // 使用 formatAssistantMessage 移除 markdown 残留
  return formatAssistantMessage(content);
}

interface ChatMessage {
  type: string;
  content: string;
  position: 'left' | 'right' | 'center';
  timestamp?: number;
  isStreaming?: boolean;
  card?: {
    type: 'product';
    products: Array<{
      sku_id: string;
      name: string;
      price: number;
      short_reason: string;
      detail_url: string;
    }>;
  };
}

export interface UseChatOptions {
  initialConfig: CreateSessionRequest;
  onHandoff?: (queueNo: number) => void;
  onOrderCreated?: (data: any) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isHandoff: boolean;
  sessionId: string | null;
  sendUserMessage: (content: string) => Promise<void>;
  requestHandoff: () => Promise<void>;
  returnToAI: () => void;
  initSession: (config?: Partial<CreateSessionRequest>) => Promise<void>;
  resetSession: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { initialConfig, onHandoff } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const configRef = useRef(initialConfig);
  const optionsRef = useRef(options);
  // 保持 configRef 始终最新
  useEffect(() => {
    configRef.current = initialConfig;
  }, [initialConfig]);

  // 保持 optionsRef 始终最新
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // WebSocket 连接
  const socketRef = useRef<Socket | null>(null);

  // 设置 WebSocket 监听（始终连接，不只是转人工时）
  useEffect(() => {
    if (!sessionId) return;

    // 连接 WebSocket 并加入会话
    socketRef.current = io('http://localhost:3000', { path: '/ws/chat' });

    socketRef.current.on('connect', () => {
      console.log('[useChat] WebSocket connected');
      socketRef.current?.emit('join-session', { sessionId });
    });

    // AI 流式消息 chunk（打字机效果）
    socketRef.current.on('message-chunk', (data: any) => {
      console.log('[useChat] 收到消息chunk:', data);
      const { answer } = data;

      // 只有收到实际内容才更新
      if (!answer) return;

      setMessages((prev) => {
        // 找到最后一条 AI 消息并更新内容
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].position === 'left' && prev[lastIndex].isStreaming) {
          const updated = [...prev];
          const currentContent = updated[lastIndex].content;
          // 如果当前是"正在思考中..."，直接替换；否则追加
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: currentContent === '正在思考中...' ? answer : currentContent + answer,
          };
          return updated;
        } else {
          // 第一条chunk，创建新消息
          return [...prev, {
            type: 'text',
            content: answer,
            position: 'left' as const,
            timestamp: Date.now(),
            isStreaming: true,
          }];
        }
      });
    });

    // AI 消息完成
    socketRef.current.on('message-complete', (data: any) => {
      console.log('[useChat] 消息完成:', data);
      const { answer, type, queueNo } = data;

      setMessages((prev) => {
        // 找到最后一条流式消息，标记完成
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].position === 'left' && prev[lastIndex].isStreaming) {
          const updated = [...prev];
          let rawContent = answer || updated[lastIndex].content;

          // 尝试解析 Dify 返回的商品信息（JSON 格式）
          let cardData = null;
          try {
            const jsonMatch = rawContent.match(/\{[\s\S]*"type"\s*:\s*"products"[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.type === 'products' && parsed.items && parsed.items.length > 0) {
                cardData = parsed.items;
                rawContent = rawContent.replace(jsonMatch[0], '').trim();
              }
            }
          } catch (e) {
            // 不是 JSON
          }

          updated[lastIndex] = {
            type: cardData ? 'card' : 'text',
            content: convertMarkdownToText(rawContent),
            position: 'left',
            timestamp: Date.now(),
            isStreaming: false,
            ...(cardData && {
              card: {
                type: 'product',
                products: cardData,
              },
            }),
          };
          return updated;
        }
        return prev;
      });

      // 检查是否转人工
      if (type === 'handoff' && queueNo) {
        setIsHandoff(true);
        if (optionsRef.current.onHandoff) {
          optionsRef.current.onHandoff(queueNo);
        }
      }
    });

    // 监听客服回复（转人工模式）
    socketRef.current.on('agent-message', (data: any) => {
      console.log('[useChat] 收到客服回复:', data);
      const agentMessage: ChatMessage = {
        type: 'text',
        content: data.content || data.message || '',
        position: 'left',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    });

    // 监听订单创建事件
    socketRef.current.on('order-created', (data: any) => {
      console.log('[useChat] 收到订单创建事件:', data);
      if (optionsRef.current.onOrderCreated) {
        optionsRef.current.onOrderCreated(data);
      }
    });

    // 监听错误
    socketRef.current.on('error', (data: any) => {
      console.error('[useChat] WebSocket错误:', data);
      setIsLoading(false);

      // 找到并移除流式消息，替换为错误消息
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].isStreaming) {
          const updated = [...prev];
          updated[lastIndex] = {
            type: 'text',
            content: data.error || '发送消息失败，请稍后重试',
            position: 'center',
            timestamp: Date.now(),
            isStreaming: false,
          };
          return updated;
        }
        return [...prev, {
          type: 'text',
          content: data.error || '发送消息失败，请稍后重试',
          position: 'center' as const,
          timestamp: Date.now(),
        }];
      });
    });

    return () => {
      socketRef.current?.emit('leave-session', { sessionId });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  // 初始化会话
  const initSession = useCallback(async (overrideConfig?: Partial<CreateSessionRequest>) => {
    setIsLoading(true);
    try {
      const requestData = {
        phone: overrideConfig?.phone || configRef.current.phone,
        storeId: overrideConfig?.storeId || configRef.current.storeId,
        storeType: overrideConfig?.storeType || configRef.current.storeType,
        channel: overrideConfig?.channel || configRef.current.channel,
      };
      console.log('initSession request:', requestData);

      const response = await createSession(requestData);
      console.log('initSession response:', response);

      setSessionId(response.sessionId);
      setIsHandoff(response.status === 'HANDOFF');

      // 如果是恢复旧会话，加载历史消息
      if (!response.isNew) {
        try {
          const historyMsgs = await getMessages(response.sessionId);
          console.log('History messages:', historyMsgs);
          if (historyMsgs && historyMsgs.length > 0) {
            const historicalMessages: ChatMessage[] = historyMsgs.map((msg: any) => ({
              type: msg.card ? 'card' : (msg.senderType === 'USER' ? 'text' : 'text'),
              content: msg.content,
              position: msg.senderType === 'USER' ? 'right' : 'left',
              timestamp: new Date(msg.createdAt).getTime(),
              card: msg.card || undefined,
            }));
            console.log('Mapped messages:', historicalMessages);
            setMessages(historicalMessages);
            return;
          }
        } catch (e) {
          console.warn('Failed to load history messages:', e);
        }
      }

      // 新会话添加欢迎消息
      const welcomeMessage: ChatMessage = {
        type: 'text',
        content: response.isNew
          ? '您好！请问有什么可以帮您？'
          : '欢迎回来！已恢复之前的对话',
        position: 'left',
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      const errorMsg: ChatMessage = {
        type: 'text',
        content: '会话初始化失败，请刷新页面重试',
        position: 'center',
        timestamp: Date.now(),
      };
      setMessages([errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 发送用户消息
  const sendUserMessage = useCallback(async (content: string) => {
    console.log('sendUserMessage called:', { sessionId, isHandoff, content });

    if (!sessionId) {
      console.error('No sessionId!');
      return;
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      type: 'text',
      content,
      position: 'right',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 如果是转人工状态，发送消息到后端（后端会保存并广播给客服）
    if (isHandoff) {
      try {
        const response = await sendMessage(sessionId, { message: content });
        console.log('发送消息给人工客服成功:', response);
      } catch (error) {
        console.error('发送消息给人工客服失败:', error);
      }
      return;
    }

    // 所有消息都发送到 Dify，通过 WebSocket 流式接收
    setIsLoading(true);

    // 添加一条 AI 思考中的消息占位，等 chunk 慢慢填入
    setMessages((prev) => [...prev, {
      type: 'text',
      content: '正在思考中...',
      position: 'left' as const,
      timestamp: Date.now(),
      isStreaming: true,
    }]);

    const inputs = {
      phone: configRef.current.phone,
      store_id: configRef.current.storeId,
      store_type: configRef.current.storeType.toLowerCase() as 'self' | 'merchant',
      channel: configRef.current.channel,
    };

    console.log('>>> [前端] 通过WebSocket发送消息:', {
      sessionId,
      message: content,
      inputs,
    });

    // 通过 WebSocket 发送消息，后端会自动流式返回
    socketRef.current?.emit('send-message', {
      sessionId,
      message: content,
      inputs,
    });

    // 注意：不再在这里等待响应，响应通过 message-chunk 和 message-complete 事件接收
    // 只有转人工时还需要通过 HTTP 发送
    setIsLoading(false);
  }, [sessionId, isHandoff, onHandoff]);

  // 手动转人工
  const requestHandoff = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await handoff(sessionId);
      setIsHandoff(true);

      const handoffMessage: ChatMessage = {
        type: 'text',
        content: '您已成功转接人工服务，请稍候，客服将为您服务...',
        position: 'left',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, handoffMessage]);

      if (onHandoff) {
        onHandoff(response.queueNo);
      }
    } catch (error) {
      console.error('Failed to request handoff:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, onHandoff]);

  // 返回智能客服
  const returnToAI = useCallback(async () => {
    if (sessionId) {
      try {
        // 调用后端 API 更新会话状态为 OPEN
        await updateSessionStatus(sessionId, 'OPEN');
        console.log('会话状态已更新为 OPEN');
      } catch (error) {
        console.error('更新会话状态失败:', error);
      }
    }
    setIsHandoff(false);
    const returnMessage: ChatMessage = {
      type: 'text',
      content: '已转回智能客服，请问有什么可以帮您？',
      position: 'left',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, returnMessage]);
  }, [sessionId]);

  // 重置会话（用于切换用户/店铺时）
  const resetSession = useCallback(() => {
    setMessages([]);
    setIsHandoff(false);
    setSessionId(null);
  }, []);

  return {
    messages,
    isLoading,
    isHandoff,
    sessionId,
    sendUserMessage,
    requestHandoff,
    returnToAI,
    initSession,
    resetSession,
  };
}

export default useChat;