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
    background: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(4px)',
  };

  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '380px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    zIndex: 1000,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
  };

  const drawerHeaderStyle: React.CSSProperties = {
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(102, 126, 234, 0.15)',
  };

  const drawerContentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const floatBtnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    zIndex: 998,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '10px',
    fontWeight: 500,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const historyItemStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.2s ease',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '14px',
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const addStoreBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    fontSize: '14px',
    color: '#a5b4fc',
    background: 'rgba(102, 126, 234, 0.15)',
    border: '1px dashed rgba(102, 126, 234, 0.4)',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.2s ease',
  };

  return (
    <>
      {/* 浮动设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        style={floatBtnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        }}
      >
        ⚙️
      </button>

      {/* 抽屉遮罩 */}
      <div style={drawerOverlayStyle} onClick={() => setIsOpen(false)} />

      {/* 抽屉内容 */}
      <div style={drawerStyle}>
        <div style={drawerHeaderStyle}>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>⚙️ 设置</span>
          <button
            onClick={() => setIsOpen(false)}
            style={closeBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={drawerContentStyle}>
          {/* 店铺选择 */}
          {stores.length > 0 && onStoreChange && (
            <div style={fieldStyle}>
              <div style={sectionTitleStyle}>🏪 店铺选择</div>
              <select
                value={config.storeId}
                onChange={(e) => {
                  const store = stores.find(s => s.id === e.target.value);
                  if (store) onStoreChange(store);
                }}
                style={selectStyle}
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id} style={{ background: '#1a1a2e' }}>
                    {store.name} ({store.storeType === 'SELF' ? '自营' : '商家'})
                  </option>
                ))}
              </select>
              {onAddStore && (
                <button
                  onClick={() => setShowAddStore(true)}
                  style={addStoreBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                  }}
                >
                  + 新增店铺
                </button>
              )}
            </div>
          )}

          {/* 新增店铺表单 */}
          {showAddStore && (
            <div style={{
              ...fieldStyle,
              padding: '20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={labelStyle}>新店铺名称</div>
              <input
                type="text"
                className="config-input"
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
                <option value="SELF" style={{ background: '#1a1a2e' }}>自营</option>
                <option value="MERCHANT" style={{ background: '#1a1a2e' }}>商家</option>
              </select>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => setShowAddStore(false)}
                  style={{
                    ...inputStyle,
                    width: 'auto',
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleAddStore}
                  style={{
                    ...inputStyle,
                    width: 'auto',
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {/* 渠道选择 */}
          <div style={fieldStyle}>
            <div style={sectionTitleStyle}>📡 渠道</div>
            <select
              value={config.channel}
              onChange={(e) => handleChange('channel', e.target.value)}
              style={selectStyle}
            >
              {CHANNEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#1a1a2e' }}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 历史配置 */}
          {historyConfigs.length > 0 && (
            <div style={fieldStyle}>
              <div style={sectionTitleStyle}>📋 历史配置</div>
              {historyConfigs.map((history, index) => (
                <div
                  key={index}
                  style={{
                    ...historyItemStyle,
                    position: 'relative',
                    paddingRight: '50px',
                  }}
                  onClick={() => selectHistory(history)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#fff' }}>
                    📱 {history.phone}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
                    🏪 {history.storeId} | {history.channel}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                    ⏰ {formatTime(history.lastUsed)}
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
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#ff7875',
                      background: 'rgba(255, 77, 79, 0.15)',
                      border: '1px solid rgba(255, 77, 79, 0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .config-input::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .config-input::-webkit-input-placeholder {
          color: rgba(255,255,255,0.4);
        }
        .config-input::-moz-placeholder {
          color: rgba(255,255,255,0.4);
        }
        .config-select option {
          background: #1a1a2e;
          color: #fff;
        }
      `}</style>
    </>
  );
};

export default ConfigPanel;