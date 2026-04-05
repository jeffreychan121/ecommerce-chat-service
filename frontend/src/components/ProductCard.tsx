import React, { useState } from 'react';
import { createLead } from '../services/api';

interface Product {
  sku_id: string;
  name: string;
  price: number;
  short_reason: string;
  detail_url?: string;
}

interface ProductCardProps {
  products: Product[];
}

export const ProductCard: React.FC<ProductCardProps> = ({ products }) => {
  const [ordering, setOrdering] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<Product | null>(null);
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleOrder = async () => {
    if (!showPhoneModal || !phone) return;

    setOrdering(showPhoneModal.sku_id);
    try {
      await createLead({
        userPhone: phone,
        storeId: '', // 会在后端从会话获取
        skuId: showPhoneModal.sku_id,
        skuName: showPhoneModal.name,
        price: showPhoneModal.price,
        quantity,
        intent: 'buy',
      });
      alert('提交成功！客服将尽快与您联系~');
      setShowPhoneModal(null);
      setPhone('');
      setQuantity(1);
    } catch (error) {
      console.error('提交留资失败:', error);
      alert('提交失败，请稍后重试');
    } finally {
      setOrdering(null);
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
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
                onClick={() => setShowPhoneModal(product)}
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
      {showPhoneModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowPhoneModal(null)}
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
              {showPhoneModal.name}
              <br />
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                ¥{showPhoneModal.price}
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                您的手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
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
                onClick={() => setShowPhoneModal(null)}
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
                disabled={!phone || ordering === showPhoneModal.sku_id}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: phone ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: phone ? 'pointer' : 'not-allowed',
                }}
              >
                {ordering === showPhoneModal.sku_id ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
