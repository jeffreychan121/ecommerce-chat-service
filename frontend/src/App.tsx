import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import OrderTest from './components/OrderTest';

interface UserInfo {
  userId: string;
  phone: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderTest, setShowOrderTest] = useState(false);

  // 检查 localStorage 中是否有登录信息
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserInfo(user);
      } catch (e) {
        localStorage.removeItem('chat_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userId: string, phone: string) => {
    setUserInfo({ userId, phone });
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_user');
    setUserInfo(null);
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>加载中...</div>
      </div>
    );
  }

  if (!userInfo) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'auto',
    }}>
      <button
        onClick={() => setShowOrderTest(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '20px',
          cursor: 'pointer',
          zIndex: 1000,
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        订单测试
      </button>
      <MainPage
        userId={userInfo.userId}
        phone={userInfo.phone}
        onLogout={handleLogout}
      />

      {/* 右侧抽屉 */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '420px',
        maxWidth: '90vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        zIndex: 2001,
        transform: showOrderTest ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 抽屉头部 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '1px',
          }}>
            📦 订单中心
          </div>
          <button
            onClick={() => setShowOrderTest(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'rotate(0)';
            }}
          >
            ✕
          </button>
        </div>

        {/* 抽屉内容区 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
        }}>
          <OrderTest />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;