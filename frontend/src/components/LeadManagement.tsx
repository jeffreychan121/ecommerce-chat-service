import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  userPhone: string;
  storeId: string;
  skuId: string;
  skuName: string;
  quantity: number;
  price: number;
  intent: string;
  status: string;
  createdAt: string;
  user?: {
    phone: string;
  };
  store?: {
    name: string;
  };
}

interface LeadManagementProps {
  storeId?: string;
  onBack: () => void;
}

const LeadManagement: React.FC<LeadManagementProps> = ({ storeId, onBack }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, [storeId]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const url = storeId
        ? `http://localhost:3000/api/guide/leads?storeId=${storeId}`
        : 'http://localhost:3000/api/guide/leads';
      const res = await fetch(url);
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error('获取留资失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (leadId: string, status: string) => {
    try {
      await fetch(`http://localhost:3000/api/guide/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const getIntentText = (intent: string) => {
    switch (intent) {
      case 'BUY': return '购买意向';
      case 'CONSULT': return '咨询';
      case 'COMPARE': return '比价';
      default: return intent;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { background: '#fff3cd', color: '#856404' };
      case 'CONTACTED':
        return { background: '#d4edda', color: '#155724' };
      case 'CLOSED':
        return { background: '#e2e3e5', color: '#383d41' };
      default:
        return { background: '#e2e3e5', color: '#383d41' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={onBack}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
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
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          ←
        </button>
        <h1 style={{
          color: '#fff',
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
        }}>
          📋 留资管理
        </h1>
        <span style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px',
          marginLeft: 'auto',
        }}>
          共 {leads.length} 条留资
        </span>
      </div>

      {/* 筛选 */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        {['all', 'PENDING', 'CONTACTED', 'CLOSED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === status ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.2)',
              background: filter === status ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {status === 'all' ? '全部' : status === 'PENDING' ? '待处理' : status === 'CONTACTED' ? '已联系' : '已关闭'}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px 24px',
      }}>
        {loading ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>
            加载中...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '40px' }}>
            暂无留资记录
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredLeads.map(lead => (
              <div
                key={lead.id}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                      {lead.skuName}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>
                      ¥{lead.price} × {lead.quantity} = ¥{lead.price * lead.quantity}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    ...getStatusStyle(lead.status),
                  }}>
                    {lead.status === 'PENDING' ? '待处理' : lead.status === 'CONTACTED' ? '已联系' : '已关闭'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}>
                  <div>
                    <span style={{ opacity: 0.5 }}>电话: </span>
                    <span style={{ color: '#fff' }}>{lead.userPhone}</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5 }}>意向: </span>
                    <span style={{ color: '#fff' }}>{getIntentText(lead.intent)}</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.5 }}>时间: </span>
                    <span style={{ color: '#fff' }}>
                      {new Date(lead.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {lead.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(lead.id, 'CONTACTED')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#28a745',
                          color: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        标记已联系
                      </button>
                      <button
                        onClick={() => updateStatus(lead.id, 'CLOSED')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          background: 'transparent',
                          color: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        关闭
                      </button>
                    </>
                  )}
                  {lead.status === 'CONTACTED' && (
                    <button
                      onClick={() => updateStatus(lead.id, 'CLOSED')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'transparent',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      关闭
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManagement;
