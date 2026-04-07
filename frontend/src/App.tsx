import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import OrderTest from './components/OrderTest';
import MerchantTraining from './components/MerchantTraining';
import AgentDashboard from './pages/AgentDashboard';
import AgentChat from './pages/AgentChat';
import LeadManagement from './components/LeadManagement';

interface UserInfo {
  userId: string;
  phone: string;
  storeId?: string;
  storeName?: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderTest, setShowOrderTest] = useState(false);
  const [showMerchantTraining, setShowMerchantTraining] = useState(false);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  const [showLeadManagement, setShowLeadManagement] = useState(false);
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // 检查 localStorage 中是否有登录信息
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // 如果没有 storeId，说明是旧缓存，需要清除并重新登录
        if (!user.storeId) {
          console.log('[App] 旧缓存无storeId，清除并重新登录');
          localStorage.removeItem('chat_user');
          setLoading(false);
          return;
        }
        console.log('[App] 从localStorage恢复:', user);
        setUserInfo(user);
      } catch (e) {
        localStorage.removeItem('chat_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userId: string, phone: string, storeId?: string, storeName?: string) => {
    setUserInfo({ userId, phone, storeId, storeName });
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
      {/* 右上角菜单按钮 */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: showMenu
              ? 'rgba(255,255,255,0.3)'
              : 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
          }}
        >
          {showMenu ? '✕' : '☰'}
        </button>

        {/* 下拉菜单 */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '54px',
            right: '0',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,255,0.98) 100%)',
            borderRadius: '16px',
            padding: '12px',
            minWidth: '180px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.5)',
            backdropFilter: 'blur(20px)',
            animation: 'menuSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {[
              { icon: '📦', label: '订单测试', color: '#667eea', action: () => { setShowOrderTest(true); setShowMenu(false); }},
              { icon: '📋', label: '留资管理', color: '#10b981', action: () => { setShowLeadManagement(true); setShowMenu(false); }},
              { icon: '📚', label: '知识训练', color: '#f59e0b', action: () => { setShowMerchantTraining(true); setShowMenu(false); }},
              { icon: '👥', label: '客服工作台', color: '#ef4444', action: () => { setShowAgentDashboard(true); setShowMenu(false); }},
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#1a1a2e',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  marginBottom: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${item.color}15 0%, ${item.color}08 100%)`;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{
                  fontSize: '18px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ color: '#ccc', fontSize: '12px' }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>

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

      {/* 商家知识库训练页面 */}
      {showMerchantTraining && userInfo && (
        <MerchantTraining
          storeId={userInfo.storeId || ''}
          storeName={userInfo.storeName || '商家知识库'}
          onBack={() => setShowMerchantTraining(false)}
        />
      )}

      {/* 留资管理页面 */}
      {showLeadManagement && userInfo && (
        <LeadManagement
          storeId={userInfo.storeId}
          onBack={() => setShowLeadManagement(false)}
        />
      )}

      {/* 客服工作台首页 - 队列列表 */}
      {showAgentDashboard && !agentSessionId && (
        <AgentDashboard
          onSelectSession={(sessionId) => setAgentSessionId(sessionId)}
          onBack={() => setShowAgentDashboard(false)}
        />
      )}

      {/* 客服聊天页面 */}
      {showAgentDashboard && agentSessionId && (
        <AgentChat
          sessionId={agentSessionId}
          onBack={() => setAgentSessionId(null)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes menuSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default App;