import { useState, useCallback, useRef } from 'react';
import { createSession, sendMessage, handoff } from '../services/api';
import type { CreateSessionRequest, SendMessageRequest } from '../types';

interface ChatMessage {
  type: string;
  content: string;
  position: 'left' | 'right' | 'center';
  timestamp?: number;
}

export interface UseChatOptions {
  initialConfig: CreateSessionRequest;
  onHandoff?: (queueNo: number) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isHandoff: boolean;
  sessionId: string | null;
  sendUserMessage: (content: string) => Promise<void>;
  requestHandoff: () => Promise<void>;
  returnToAI: () => void;
  initSession: () => Promise<void>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { initialConfig, onHandoff } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const configRef = useRef(initialConfig);
  configRef.current = initialConfig;

  // 初始化会话
  const initSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await createSession({
        phone: configRef.current.phone,
        storeId: configRef.current.storeId,
        storeType: configRef.current.storeType,
        channel: configRef.current.channel,
      });

      setSessionId(response.sessionId);
      setIsHandoff(response.status === 'HANDOFF');

      // 添加欢迎消息
      const welcomeMessage: ChatMessage = {
        type: 'text',
        content: '您好！请问有什么可以帮您？',
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
    if (!sessionId || isHandoff) return;

    // 添加用户消息
    const userMessage: ChatMessage = {
      type: 'text',
      content,
      position: 'right',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const requestData: SendMessageRequest = {
        message: content,
        inputs: {
          phone: configRef.current.phone,
          store_id: configRef.current.storeId,
          store_type: configRef.current.storeType,
          channel: configRef.current.channel,
        },
      };

      const response = await sendMessage(sessionId, requestData);

      // 添加 AI 回复
      if (response.answer || response.message) {
        const aiMessage: ChatMessage = {
          type: 'text',
          content: response.answer || response.message || '',
          position: 'left',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }

      // 检查是否转人工
      if (response.type === 'handoff') {
        setIsHandoff(true);
        if (onHandoff && response.queueNo) {
          onHandoff(response.queueNo);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        type: 'text',
        content: '发送消息失败，请稍后重试',
        position: 'left',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
        content: `您已成功转接人工服务，当前排队号：${response.queueNo}，请稍候...`,
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
  const returnToAI = useCallback(() => {
    setIsHandoff(false);
    const returnMessage: ChatMessage = {
      type: 'text',
      content: '已转回智能客服，请问有什么可以帮您？',
      position: 'left',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, returnMessage]);
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
  };
}

export default useChat;