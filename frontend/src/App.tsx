import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import ConfigPanel, { ChatConfig } from './components/ConfigPanel';
import { useChat } from './hooks/useChat';

const defaultConfig: ChatConfig = {
  phone: '13800138001',
  storeId: 'store_001',
  storeType: 'SELF',
  channel: '小程序',
};

function App() {
  const [config, setConfig] = useState<ChatConfig>(defaultConfig);
  const [isStarted, setIsStarted] = useState(false);

  const {
    messages,
    isLoading,
    isHandoff,
    sendUserMessage,
    requestHandoff,
    returnToAI,
    initSession,
  } = useChat({
    initialConfig: config,
    onHandoff: (queueNo) => {
      console.log('转人工，排队号:', queueNo);
    },
  });

  const handleStart = async () => {
    await initSession();
    setIsStarted(true);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    background: '#f5f5f5',
  };

  const startButtonStyle: React.CSSProperties = {
    padding: '16px 32px',
    fontSize: '18px',
    background: '#1677ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(22, 119, 255, 0.3)',
    transition: 'all 0.3s ease',
  };

  const chatWindowStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    height: '600px',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={containerStyle}>
      {!isStarted ? (
        <button
          onClick={handleStart}
          style={startButtonStyle}
          disabled={isLoading}
        >
          {isLoading ? '正在启动...' : '开始咨询'}
        </button>
      ) : (
        <div style={chatWindowStyle}>
          <ChatWindow
            messages={messages}
            isHandoff={isHandoff}
            isLoading={isLoading}
            onSend={sendUserMessage}
            onHandoff={requestHandoff}
            onReturnToAI={returnToAI}
            title="智能客服"
          />
        </div>
      )}
      <ConfigPanel config={config} onChange={setConfig} />
    </div>
  );
}

export default App;
