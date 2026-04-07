import React, { useState, useEffect } from 'react';
import { createOrder } from '../services/api';

interface Product {
  sku_id: string;
  name: string;
  price: number;
  short_reason: string;
  detail_url?: string;
}

interface ProductCardProps {
  products: Product[];
  userPhone?: string;  // 从会话中获取
}

export const ProductCard: React.FC<ProductCardProps> = ({ products, userPhone }) => {
  const [ordering, setOrdering] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [address, setAddress] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleOrder = async () => {
    if (!showOrderModal || !userPhone) {
      setToast({ message: '请先登录后再下单', type: 'error' });
      return;
    }

    setOrdering(showOrderModal.sku_id);
    try {
      // 确保 price 是数字类型
      const orderPrice = Number(showOrderModal.price);
      await createOrder({
        phone: userPhone,
        items: [{
          skuId: showOrderModal.sku_id,
          quantity,
          productName: showOrderModal.name,
          price: orderPrice,
        }],
        shippingAddress: address,
        receiverName: receiverName || '客户',
        receiverPhone: receiverPhone || userPhone,
      });
      setToast({ message: '订单创建成功！', type: 'success' });
      setShowOrderModal(null);
      setQuantity(1);
      setAddress('');
      setReceiverName('');
      setReceiverPhone('');
    } catch (error) {
      console.error('创建订单失败:', error);
      setToast({ message: '创建订单失败，请稍后重试', type: 'error' });
    } finally {
      setOrdering(null);
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Toast 提示 */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: '8px',
          background: toast.type === 'success' ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
          color: '#fff',
          fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9999,
        }}>
          {toast.message}
        </div>
      )}
      {products.map((product) => (
        <div
          key={product.sku_id}
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            borderRadius: '12px',
            border: '1px solid #e8e8e8',
            padding: '14px',
            marginBottom: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* 商品名称 */}
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#333',
            marginBottom: '6px',
          }}>
            {product.name}
          </div>

          {/* 商品描述 */}
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '10px',
          }}>
            {product.short_reason}
          </div>

          {/* 价格和操作 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#ff4d4f',
            }}>
              ¥{product.price}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => window.open(product.detail_url || '#', '_blank')}
                style={{
                  padding: '6px 12px',
                  background: '#fff',
                  border: '1px solid #667eea',
                  borderRadius: '16px',
                  color: '#667eea',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                }}
              >
                查看详情
              </button>
              <button
                onClick={() => setShowOrderModal(product)}
                style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                立即下单
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* 手机号输入弹窗 */}
      {showOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowOrderModal(null)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '320px',
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              提交订单
            </div>

            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              {showOrderModal.name}
              <br />
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                ¥{showOrderModal.price}
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                收货人 <span style={{ color: '#999', fontSize: '12px' }}>（可选）</span>
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="请输入收货人姓名"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                收货人电话 <span style={{ color: '#999', fontSize: '12px' }}>（可选）</span>
              </label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="请输入收货人电话"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                收货地址 <span style={{ color: '#999', fontSize: '12px' }}>（可选）</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="请输入收货地址"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                购买数量
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: '#f5f5f5',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', minWidth: '40px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: '#f5f5f5',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowOrderModal(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleOrder}
                disabled={ordering === showOrderModal.sku_id}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {ordering === showOrderModal.sku_id ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
