import React from 'react';

export interface ChatConfig {
  phone: string;
  storeId: string;
  storeType: 'SELF' | 'MERCHANT';
  channel: string;
}

interface ConfigPanelProps {
  config: ChatConfig;
  onChange: (config: ChatConfig) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const handleChange = (field: keyof ChatConfig, value: string) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '16px',
    right: '16px',
    padding: '16px',
    background: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    minWidth: '240px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#333',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    color: '#666',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>会话配置</div>

      <div style={fieldStyle}>
        <label style={labelStyle}>手机号</label>
        <input
          type="text"
          value={config.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          style={inputStyle}
          placeholder="请输入手机号"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>店铺ID</label>
        <input
          type="text"
          value={config.storeId}
          onChange={(e) => handleChange('storeId', e.target.value)}
          style={inputStyle}
          placeholder="请输入店铺ID"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>店铺类型</label>
        <select
          value={config.storeType}
          onChange={(e) => handleChange('storeType', e.target.value)}
          style={selectStyle}
        >
          <option value="SELF">自营店铺</option>
          <option value="MERCHANT">第三方店铺</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>渠道</label>
        <input
          type="text"
          value={config.channel}
          onChange={(e) => handleChange('channel', e.target.value)}
          style={inputStyle}
          placeholder="请输入渠道"
        />
      </div>
    </div>
  );
};

export default ConfigPanel;