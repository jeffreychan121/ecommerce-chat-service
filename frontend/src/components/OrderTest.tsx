import React, { useState, useEffect } from 'react';
import { createOrder, getOrders, OrderInfo } from '../services/api';

// 物流信息类型
interface LogisticsInfo {
  orderNo: string;
  carrier: string;
  trackingNo: string;
  status: string;
  currentLocation: string;
  estimatedDeliveryTime?: string;
  events: Array<{
    time: string;
    location: string;
    description: string;
  }>;
}

const OrderTest: React.FC = () => {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [logistics, setLogistics] = useState<LogisticsInfo | null>(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);

  // 加载订单列表
  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrders(50);
      setOrders(data);
    } catch (e: any) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 加载物流信息
  const loadLogistics = async (orderNo: string) => {
    if (expandedOrder === orderNo) {
      setExpandedOrder(null);
      setLogistics(null);
      return;
    }
    setExpandedOrder(orderNo);
    setLogisticsLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderNo}/logistics`);
      const data = await res.json();
      setLogistics(data);
    } catch (e) {
      setLogistics(null);
    } finally {
      setLogisticsLoading(false);
    }
  };

  const handleCreate = async () => {
    const qty = parseInt(quantity) || 1;
    if (qty < 1 || qty > 99) {
      setError('数量需在1-99之间');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await createOrder({
        phone: '13800000000',
        items: [{ skuId: 'SKU001', quantity: qty }],
        shippingAddress: '北京市朝阳区xxx街道1号',
        receiverName: '测试用户',
        receiverPhone: '13800000000',
      });
      setOrders(prev => [data, ...prev]);
      setMode('list');
      setQuantity('1');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#faad14',
      PAID: '#1890ff',
      TO_BE_SHIPPED: '#fa8c16',
      SHIPPED: '#1890ff',
      DELIVERED: '#52c41a',
      CANCELLED: '#ff4d4f',
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: '待支付',
      PAID: '已支付',
      TO_BE_SHIPPED: '待发货',
      SHIPPED: '已发货',
      DELIVERED: '已送达',
      CANCELLED: '已取消',
    };
    return texts[status] || status;
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 样式
  const containerStyle: React.CSSProperties = {
    width: '100%',
    margin: '0 auto',
    padding: '0',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '20px',
    letterSpacing: '2px',
    display: 'none', // 隐藏，因为抽屉头部已有
  };

  const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '6px',
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    background: active
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'rgba(255,255,255,0.1)',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: active ? '0 4px 16px rgba(102, 126, 234, 0.4)' : 'none',
  });

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const orderNoStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'monospace',
  };

  const statusBadgeStyle = (status: string): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    background: getStatusColor(status),
    boxShadow: `0 2px 8px ${getStatusColor(status)}40`,
  });

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
  };

  const valueStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    fontWeight: 500,
  };

  const priceStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f97316',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '18px',
    fontSize: '18px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '14px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    textAlign: 'center',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontWeight: 500,
  };

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '18px',
    fontSize: '16px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  // 物流折叠面板样式
  const logisticsCardStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '14px',
    padding: '14px',
    marginTop: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const logisticsTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#667eea',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const eventItemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px dashed rgba(255,255,255,0.1)',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    padding: '80px 20px',
    fontSize: '15px',
  };

  return (
    <>
      <div style={containerStyle}>
        <div style={titleStyle}>订单中心</div>

      <div style={tabContainerStyle}>
        <button style={tabBtnStyle(mode === 'list')} onClick={() => setMode('list')}>
          📋 订单列表 ({orders.length})
        </button>
        <button style={tabBtnStyle(mode === 'create')} onClick={() => setMode('create')}>
          ➕ 创建订单
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: 'rgba(255,77,79,0.15)',
          color: '#ff4d4f',
          borderRadius: '12px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {mode === 'list' ? (
        orders.length > 0 ? (
          orders.map(order => (
            <div key={order.orderNo} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={orderNoStyle}>{order.orderNo}</span>
                <span style={statusBadgeStyle(order.status)}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>商品</span>
                <span style={valueStyle}>{order.items?.[0]?.title || '-'}</span>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>数量</span>
                <span style={{ ...valueStyle, fontWeight: 600 }}>×{order.items?.[0]?.quantity || 1}</span>
              </div>

              <div style={rowStyle}>
                <span style={labelStyle}>单价</span>
                <span style={valueStyle}>¥{order.items?.[0]?.price || 0}</span>
              </div>

              <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: '8px' }}>
                <span style={labelStyle}>实付</span>
                <span style={priceStyle}>¥{order.actualAmount}</span>
              </div>

              {/* 展开物流信息 */}
              {expandedOrder === order.orderNo && (
                <div style={logisticsCardStyle}>
                  {logisticsLoading ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>加载物流中...</div>
                  ) : logistics ? (
                    <>
                      <div style={logisticsTitleStyle}>
                        🚚 物流信息
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>快递公司</span>
                        <span style={valueStyle}>{logistics.carrier}</span>
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>运单号</span>
                        <span style={{ ...valueStyle, fontFamily: 'monospace' }}>{logistics.trackingNo}</span>
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>当前地点</span>
                        <span style={valueStyle}>{logistics.currentLocation}</span>
                      </div>
                      <div style={{ ...rowStyle, borderBottom: 'none' }}>
                        <span style={labelStyle}>状态</span>
                        <span style={statusBadgeStyle(logistics.status)}>
                          {logistics.status === 'IN_TRANSIT' ? '运输中' : logistics.status === 'DELIVERED' ? '已送达' : '待发货'}
                        </span>
                      </div>

                      {logistics.events && logistics.events.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>物流轨迹</div>
                          {logistics.events.slice(0, 3).map((event, idx) => (
                            <div key={idx} style={eventItemStyle}>
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', width: '60px' }}>
                                {formatTime(event.time)}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{event.description}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{event.location}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>暂无物流信息</div>
                  )}
                </div>
              )}

              <button
                onClick={() => loadLogistics(order.orderNo)}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f8f9fa',
                  border: '1px solid #e8e8e8',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#667eea',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                {expandedOrder === order.orderNo ? '▲ 收起物流' : '▼ 查看物流'}
              </button>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>
            {loading ? '⏳ 加载中...' : '📭 暂无订单'}
          </div>
        )
      ) : (
        <div style={cardStyle}>
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '15px',
            fontWeight: 500,
          }}>
            创建新订单
          </div>

          <input
            type="number"
            className="order-input"
            placeholder="输入商品数量"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.border = '2px solid rgba(255,255,255,0.6)';
              e.target.style.background = 'rgba(255,255,255,0.25)';
            }}
            onBlur={(e) => {
              e.target.style.border = '2px solid rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.15)';
            }}
          />

          <button
            style={btnStyle}
            onClick={handleCreate}
            disabled={loading}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
          >
            {loading ? '⏳ 创建中...' : '✨ 创建订单'}
          </button>
        </div>
      )}
    </div>
    <style>{`
      .order-input::placeholder {
        color: rgba(255,255,255,0.5);
      }
    `}</style>
    </>
  );
};

export default OrderTest;