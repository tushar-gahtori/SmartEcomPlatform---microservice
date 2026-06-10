import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartSidebar: React.FC = () => {
  const { cart, isOpen, closeCart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/cart');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div onClick={closeCart} style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 200,
        backdropFilter: 'blur(2px)',
      }} />

      {/* Sidebar */}
      <div className="slide-in" style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 420,
        height: '100vh',
        background: 'white',
        zIndex: 201,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#6366f1',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShoppingBag size={22} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Cart</h2>
              <p style={{ fontSize: 13, opacity: 0.85 }}>
                {cart?.items?.length ?? 0} items
              </p>
            </div>
          </div>
          <button onClick={closeCart} style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!cart || cart.items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: '#64748b',
            }}>
              <ShoppingBag size={64} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 18, fontWeight: 600 }}>Cart is empty</p>
              <p style={{ fontSize: 14 }}>Add some products to get started</p>
<button
  className="btn btn-primary"
  style={{ marginTop: 24 }}
  onClick={() => { closeCart(); navigate('/products'); }}>
  Browse Products
</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.items.map((item) => (
                <div key={item.productId} style={{
                  display: 'flex',
                  gap: 12,
                  padding: 16,
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    background: '#e0e7ff',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}>
                    🛍️
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {item.productName}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748b' }}>
                      ₹{item.unitPrice.toLocaleString()} × {item.quantity}
                    </p>
                    <p style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                      ₹{item.totalPrice.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)
                      .then(() => toast.success('Item removed'))}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 8,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                    }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div style={{
            padding: 24,
            borderTop: '1px solid #e2e8f0',
            background: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
              color: '#64748b',
            }}>
              <span>Subtotal</span>
              <span>₹{cart.totalCartPrice.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 20,
              fontSize: 14,
              color: '#64748b',
            }}>
              <span>Shipping</span>
              <span style={{ color: '#10b981' }}>Free</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ color: '#6366f1' }}>
                ₹{cart.totalCartPrice.toLocaleString()}
              </span>
            </div>
            <button onClick={handleCheckout} className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;