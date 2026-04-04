import React, { useState, useEffect } from 'react';
import { Store } from '../services/api';

export interface ChatConfig {
  phone: string;
  storeId: string;
  storeType: 'SELF' | 'MERCHANT';
  channel: string;
}

interface ConfigPanelProps {
  config: ChatConfig;
  onChange: (config: ChatConfig) => void;
  onConfigChange?: (oldConfig: ChatConfig, newConfig: ChatConfig) => void;
  stores?: Store[];
  onAddStore?: (name: string, storeType: 'SELF' | 'MERCHANT') => Promise<boolean>;
  onStoreChange?: (store: Store) => void;
}

interface HistoryConfig extends ChatConfig {
  lastUsed: number;
}

const CHANNEL_OPTIONS = [
  { value: 'H5', label: 'H5' },
  { value: '小程序', label: '小程序' },
  { value: 'APP', label: 'APP' },
  { value: '公众号', label: '公众号' },
  { value: '网页', label: '网页' },
];

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  onConfigChange,
  stores = [],
  onAddStore,
  onStoreChange,
}) => {
  const [historyConfigs, setHistoryConfigs] = useState<HistoryConfig[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreType, setNewStoreType] = useState<'SELF' | 'MERCHANT'>('SELF');

  // 同步外部config变化
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // 加载历史配置
  useEffect(() => {
    const configs = localStorage.getItem('chat_history_configs');
    if (configs) {
      setHistoryConfigs(JSON.parse(configs));
    }
  }, []);

  // 检测配置变化并触发回调
  useEffect(() => {
    if (onConfigChange) {
      const hasChanged = localConfig.phone !== config.phone || localConfig.storeId !== config.storeId;
      if (hasChanged) {
        onConfigChange(config, localConfig);
      }
    }
  }, [localConfig, config, onConfigChange]);

  const handleChange = (field: keyof ChatConfig, value: string) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const selectHistory = (history: HistoryConfig) => {
    onChange({
      phone: history.phone,
      storeId: history.storeId,
      storeType: history.storeType,
      channel: history.channel,
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const handleAddStore = async () => {
    if (!newStoreName.trim() || !onAddStore) return;
    const success = await onAddStore(newStoreName.trim(), newStoreType);
    if (success) {
      setShowAddStore(false);
      setNewStoreName('');
      setNewStoreType('SELF');
    }
  };

  // 抽屉容器样式
  const drawerOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
  };

  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '360px',
    background: '#fff',
    zIndex: 1000,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
  };

  const drawerHeaderStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const drawerContentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    border: 'none',
    background: '#f5f5f5',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const floatBtnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    zIndex: 998,
    transition: 'transform 0.2s ease',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    fontWeight: 500,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    background: '#fff',
  };

  const historyItemStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '8px',
    background: '#f8f8f8',
    transition: 'background 0.2s',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '12px',
    marginTop: '20px',
  };

  const addStoreBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    color: '#667eea',
    background: '#f0f5ff',
    border: '1px dashed #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  };

  return (
    <>
      {/* 浮动设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        style={floatBtnStyle}
      >
        ⚙️
      </button>

      {/* 抽屉遮罩 */}
      <div style={drawerOverlayStyle} onClick={() => setIsOpen(false)} />

      {/* 抽屉内容 */}
      <div style={drawerStyle}>
        <div style={drawerHeaderStyle}>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>设置</span>
          <button onClick={() => setIsOpen(false)} style={closeBtnStyle}>✕</button>
        </div>

        <div style={drawerContentStyle}>
          {/* 店铺选择 */}
          {stores.length > 0 && onStoreChange && (
            <div style={fieldStyle}>
              <div style={sectionTitleStyle}>选择店铺</div>
              <select
                value={config.storeId}
                onChange={(e) => {
                  const store = stores.find(s => s.id === e.target.value);
                  if (store) onStoreChange(store);
                }}
                style={selectStyle}
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.storeType === 'SELF' ? '自营' : '商家'})
                  </option>
                ))}
              </select>
              {onAddStore && (
                <button
                  onClick={() => setShowAddStore(true)}
                  style={addStoreBtnStyle}
                >
                  + 新增店铺
                </button>
              )}
            </div>
          )}

          {/* 新增店铺表单 */}
          {showAddStore && (
            <div style={{ ...fieldStyle, padding: '16px', background: '#f9f9f9', borderRadius: '12px' }}>
              <div style={labelStyle}>新店铺名称</div>
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="请输入店铺名称"
                style={inputStyle}
              />
              <div style={labelStyle}>店铺类型</div>
              <select
                value={newStoreType}
                onChange={(e) => setNewStoreType(e.target.value as 'SELF' | 'MERCHANT')}
                style={selectStyle}
              >
                <option value="SELF">自营</option>
                <option value="MERCHANT">商家</option>
              </select>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => setShowAddStore(false)}
                  style={{ ...inputStyle, width: 'auto', padding: '8px 16px', background: '#fff' }}
                >
                  取消
                </button>
                <button
                  onClick={handleAddStore}
                  style={{ ...inputStyle, width: 'auto', padding: '8px 16px', background: '#667eea', color: '#fff', border: 'none' }}
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {/* 渠道选择 */}
          <div style={fieldStyle}>
            <div style={sectionTitleStyle}>渠道</div>
            <select
              value={config.channel}
              onChange={(e) => handleChange('channel', e.target.value)}
              style={selectStyle}
            >
              {CHANNEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 历史配置 */}
          {historyConfigs.length > 0 && (
            <div style={fieldStyle}>
              <div style={sectionTitleStyle}>历史配置</div>
              {historyConfigs.map((history, index) => (
                <div
                  key={index}
                  style={{
                    ...historyItemStyle,
                    position: 'relative',
                    paddingRight: '40px',
                  }}
                  onClick={() => selectHistory(history)}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                    📱 {history.phone}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    🏪 {history.storeId} | {history.channel}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    {formatTime(history.lastUsed)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newHistory = historyConfigs.filter((_, i) => i !== index);
                      setHistoryConfigs(newHistory);
                      localStorage.setItem('chat_history_configs', JSON.stringify(newHistory));
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#ff4d4f',
                      background: 'transparent',
                      border: '1px solid #ff4d4f',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ConfigPanel;