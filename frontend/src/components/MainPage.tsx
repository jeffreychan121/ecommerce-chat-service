import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import ConfigPanel, { ChatConfig } from './ConfigPanel';
import { useChat } from '../hooks/useChat';
import { getStores, createStore, deleteStore, Store } from '../services/api';

interface MainPageProps {
  userId: string;
  phone: string;
  onLogout: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ userId: _userId, phone, onLogout }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStore, setPendingStore] = useState<Store | null>(null);
  const [deleteConfirmStore, setDeleteConfirmStore] = useState<Store | null>(null);

  // 默认配置
  const defaultConfig: ChatConfig = {
    phone,
    storeId: '',
    storeType: 'SELF',
    channel: 'H5',
  };

  const [config, setConfig] = useState<ChatConfig>(defaultConfig);

  const {
    messages,
    isLoading,
    isHandoff,
    sendUserMessage,
    requestHandoff,
    returnToAI,
    initSession,
    resetSession,
  } = useChat({
    initialConfig: config,
    onHandoff: (queueNo) => {
      console.log('转人工，排队号:', queueNo);
    },
  });

  // 加载店铺列表
  useEffect(() => {
    loadStores();
  }, []);

  // 当店铺选择变化时更新 config
  useEffect(() => {
    if (selectedStore) {
      setConfig(prev => ({
        ...prev,
        storeId: selectedStore.id,
        storeType: selectedStore.storeType,
      }));
    }
  }, [selectedStore]);

  const loadStores = async () => {
    try {
      let storeList = await getStores();

      // 如果没有店铺，创建默认的自营店铺
      if (storeList.length === 0) {
        const defaultStore = await createStore('自营旗舰店', 'SELF');
        storeList = [defaultStore];
      }

      setStores(storeList);
      if (storeList.length > 0) {
        setSelectedStore(storeList[0]);
      }
    } catch (e) {
      console.error('Failed to load stores:', e);
    }
  };

  const handleAddStore = async (name: string, storeType: 'SELF' | 'MERCHANT') => {
    try {
      const newStore = await createStore(name, storeType);
      setStores(prev => [newStore, ...prev]);
      // 不要切换当前选中的店铺
      // setSelectedStore(newStore);
      return true;
    } catch (e) {
      console.error('Failed to create store:', e);
      return false;
    }
  };

  const handleDeleteStore = async (store: Store) => {
    try {
      await deleteStore(store.id);
      setStores(prev => prev.filter(s => s.id !== store.id));
      // 如果删除的是当前选中的店铺，清除选择
      if (selectedStore?.id === store.id) {
        setSelectedStore(null);
        setIsStarted(false);
      }
      setDeleteConfirmStore(null);
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  const handleStart = async () => {
    if (!selectedStore) {
      alert('请先选择店铺');
      return;
    }
    await initSession();
    setIsStarted(true);
  };

  // 店铺切换确认
  const handleStoreChange = (store: Store) => {
    if (store.id === selectedStore?.id) return;

    if (isStarted) {
      setPendingStore(store);
      setShowConfirm(true);
    } else {
      setSelectedStore(store);
    }
  };

  const confirmSwitch = async () => {
    if (pendingStore) {
      // 保存当前会话到历史
      const historyConfigs = JSON.parse(localStorage.getItem('chat_history_configs') || '[]');
      const newConfig = { ...config, lastUsed: Date.now() };
      const filtered = historyConfigs.filter((c: any) => c.phone !== config.phone || c.storeId !== config.storeId);
      const updated = [newConfig, ...filtered].slice(0, 10);
      localStorage.setItem('chat_history_configs', JSON.stringify(updated));

      // 更新配置（包含新的店铺信息）
      const newConfigWithStore = {
        ...config,
        storeId: pendingStore.id,
        storeType: pendingStore.storeType,
      };
      setConfig(newConfigWithStore);
      setSelectedStore(pendingStore);

      // 重新初始化会话，传入新店铺的配置
      await initSession({
        phone: phone,
        storeId: pendingStore.id,
        storeType: pendingStore.storeType,
        channel: config.channel,
      });
    }
    setShowConfirm(false);
    setPendingStore(null);
  };

  const cancelSwitch = () => {
    setShowConfirm(false);
    setPendingStore(null);
  };

  const handleLogout = () => {
    resetSession();
    setIsStarted(false);
    onLogout();
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const startCardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    borderRadius: '24px',
    padding: '32px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    padding: '16px',
    background: 'linear-gradient(135deg, #f0f5ff 0%, #f5f0ff 100%)',
    borderRadius: '16px',
    border: '1px solid #e0e5ff',
  };

  const userInfoLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  };

  const avatarStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  };

  const userTextStyle: React.CSSProperties = {
    textAlign: 'left',
  };

  const userNameStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1f1f1f',
    marginBottom: '4px',
  };

  const userPhoneStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#667eea',
    fontWeight: 500,
    fontFamily: 'monospace',
  };

  const storeTagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: '#fff',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#764ba2',
    border: '1px solid #e0d8ff',
    marginTop: '6px',
  };

  const logoutBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#667eea',
    background: '#fff',
    border: '1.5px solid #667eea',
    borderRadius: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const storeSelectStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    marginBottom: '24px',
    background: '#fff',
    cursor: 'pointer',
  };

  const startButtonStyle: React.CSSProperties = {
    padding: '16px 48px',
    fontSize: '17px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s ease',
  };

  const chatWindowStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    height: 'calc(100vh - 40px)',
    maxHeight: '800px',
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
  };

  const confirmOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  };

  const confirmBoxStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '320px',
    width: '90%',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      {/* 确认切换弹窗 */}
      {showConfirm && (
        <div style={confirmOverlayStyle}>
          <div style={confirmBoxStyle}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              确认切换店铺？
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              切换店铺将结束当前会话，开始新的对话
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={cancelSwitch} style={{ ...logoutBtnStyle, padding: '10px 24px' }}>
                取消
              </button>
              <button onClick={confirmSwitch} style={{ ...startButtonStyle, padding: '10px 24px', fontSize: '14px' }}>
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}

      {!isStarted ? (
        <div style={startCardStyle}>
          {/* 用户信息 */}
          <div style={userInfoStyle}>
            <div style={userInfoLeftStyle}>
              <div style={avatarStyle}>👤</div>
              <div style={userTextStyle}>
                <div style={userNameStyle}>已登录用户</div>
                <div style={userPhoneStyle}>📱 {phone}</div>
                {selectedStore && (
                  <div style={storeTagStyle}>
                    🏪 {selectedStore.name}
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleLogout} style={logoutBtnStyle}>
              登出
            </button>
          </div>

          {/* 店铺选择 */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={selectedStore?.id || ''}
              onChange={(e) => {
                const store = stores.find(s => s.id === e.target.value);
                if (store) handleStoreChange(store);
              }}
              style={storeSelectStyle}
            >
              {stores.length === 0 && <option value="">暂无店铺</option>}
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.storeType === 'SELF' ? '自营' : '商家'})
                </option>
              ))}
            </select>
            {/* 删除按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const store = stores.find(s => s.id === selectedStore?.id);
                if (store) setDeleteConfirmStore(store);
              }}
              style={{
                position: 'absolute',
                right: '30px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="删除当前店铺"
            >
              🗑️
            </button>
          </div>

          <button
            onClick={handleStart}
            disabled={!selectedStore || isLoading}
            style={{
              ...startButtonStyle,
              opacity: (!selectedStore || isLoading) ? 0.6 : 1,
            }}
          >
            {isLoading ? '正在启动...' : '开始咨询'}
          </button>
        </div>
      ) : (
        <div style={chatWindowStyle}>
          <ChatWindow
            messages={messages}
            isHandoff={isHandoff}
            isLoading={isLoading}
            onSend={sendUserMessage}
            onHandoff={requestHandoff}
            onReturnToAI={returnToAI}
            title="商城客服"
            phone={phone}
            storeName={selectedStore?.name}
            storeType={selectedStore?.storeType}
          />
        </div>
      )}
      <ConfigPanel
        config={config}
        onChange={setConfig}
        stores={stores}
        onAddStore={handleAddStore}
        onStoreChange={handleStoreChange}
      />

      {/* 删除确认对话框 */}
      {deleteConfirmStore && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setDeleteConfirmStore(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '360px',
            textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#333' }}>确认删除</h3>
            <p style={{ margin: '0 0 24px', color: '#666' }}>
              确定删除店铺「{deleteConfirmStore.name}」吗？删除后该店铺的所有会话记录将被一并删除。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmStore(null)}
                style={{
                  padding: '8px 24px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteStore(deleteConfirmStore)}
                style={{
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#ff4d4f',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;