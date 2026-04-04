import { useState, useCallback, useRef, useEffect } from 'react';
import { createSession, sendMessage, handoff, getMessages, updateSessionStatus } from '../services/api';
import type { CreateSessionRequest, SendMessageRequest } from '../types';

// 转换 markdown 表格为普通文本
function convertMarkdownToText(content: string): string {
  const lines = content.trim().split('\n');
  let result = '';
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 检测表格行（包含 | 且有 | 分隔）
    if (trimmed.includes('|') && (trimmed.startsWith('|') || trimmed.endsWith('|'))) {
      // 跳过表头分隔行 (---|:)
      if (trimmed.match(/^[\|:\-\s]+$/)) {
        continue;
      }

      inTable = true;
      const cells = trimmed.split('|').filter(c => c.trim());
      // 过滤掉分隔符（包含 - 或 : 的行）
      if (cells.every(c => c.match(/^[\s:\-]+$/))) {
        continue;
      }
      result += cells.map(c => c.trim()).join('  ') + '\n';
    } else {
      if (inTable) {
        result += '\n';
        inTable = false;
      }
      // 处理普通标题 (# ## ###)
      let processedLine = trimmed
        .replace(/^#{1,6}\s+/, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/`$/, '');
      if (processedLine) {
        result += processedLine + '\n';
      }
    }
  }

  return result.trim() || content;
}

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
  // 保持 configRef 始终最新
  useEffect(() => {
    configRef.current = initialConfig;
  }, [initialConfig]);

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
              type: msg.senderType,
              content: msg.content,
              position: msg.senderType === 'USER' ? 'right' : 'left',
              timestamp: new Date(msg.createdAt).getTime(),
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

    // 如果是转人工状态，只发送消息不调用AI
    if (isHandoff) {
      // TODO: 发送消息给人工客服API
      console.log('发送消息给人工客服:', content);
      return;
    }

    setIsLoading(true);

    try {
      const inputs = {
        phone: configRef.current.phone,
        store_id: configRef.current.storeId,
        store_type: configRef.current.storeType.toLowerCase() as 'self' | 'merchant',
        channel: configRef.current.channel,
      };
      const requestData: SendMessageRequest = {
        message: content,
        inputs,
      };
      console.log('>>> [前端] 发送消息请求:', {
        sessionId,
        message: content,
        phone: inputs.phone,
        store_id: inputs.store_id,
        store_type: inputs.store_type,
        channel: inputs.channel,
      });

      const response = await sendMessage(sessionId, requestData);
      console.log('>>> [前端] 发送消息响应:', response);

      // 添加 AI 回复
      if (response.answer || response.message) {
        const rawContent = response.answer || response.message || '';
        const aiMessage: ChatMessage = {
          type: 'text',
          content: convertMarkdownToText(rawContent),
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
    } catch (error: any) {
      console.error('>>> [前端] 发送消息失败:', error);
      console.error('>>> [前端] 错误状态:', error.response?.status);
      console.error('>>> [前端] 错误数据:', error.response?.data);
      console.error('>>> [前端] 错误信息:', error.message);

      const errorMessage: ChatMessage = {
        type: 'text',
        content: error.response?.data?.message || '发送消息失败，请稍后重试',
        position: 'center',
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