import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (userId: string, phone: string, storeId?: string, storeName?: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('13800138001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { login } = await import('../services/api');
      const response = await login(phone);
      console.log('[LoginPage] 登录响应:', response);
      // 保存登录信息到 localStorage
      localStorage.setItem('chat_user', JSON.stringify({
        userId: response.userId,
        phone: response.phone,
        storeId: response.storeId,
        storeName: response.storeName,
      }));
      onLogin(response.userId, response.phone, response.storeId, response.storeName);
    } catch (e: any) {
      setError(e.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    background: '#fff',
    borderRadius: '24px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  };

  const logoStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1f1f1f',
    marginBottom: '8px',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '32px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    boxSizing: 'border-box',
    marginBottom: '16px',
    textAlign: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s ease',
  };

  const errorStyle: React.CSSProperties = {
    color: '#ff4d4f',
    fontSize: '14px',
    marginBottom: '16px',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>💬</div>
        <div style={titleStyle}>智能客服</div>
        <div style={descStyle}>请输入手机号登录</div>

        <input
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
          maxLength={11}
        />

        {error && <div style={errorStyle}>{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;