import React, { useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await api.post('/api/orders/checkout');
      await refreshCart();
      toast.success('Order placed successfully! 🎉');
      navigate('/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <ShoppingBag size={80} color="#e2e8f0" style={{ marginBottom: 24 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Your cart is empty
        </h2>
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          Add some products to get started
        </p>
        <Link to="/products" className="btn btn-primary btn-lg">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '48px 0',
      }}>
        <div className="container">
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>
            Shopping Cart
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
            {cart.items.length} items in your cart
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 32,
          alignItems: 'start',
        }}>

          {/* Cart Items */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <Link to="/products" className="btn btn-outline btn-sm">
                <ArrowLeft size={14} />
                Continue Shopping
              </Link>
              <button
                onClick={() => clearCart().then(() =>
                  toast.success('Cart cleared'))}
                className="btn btn-danger btn-sm">
                <Trash2 size={14} />
                Clear Cart
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.items.map(item => (
                <div key={item.productId} className="card" style={{
                  padding: 20,
                  display: 'flex',
                  gap: 20,
                  alignItems: 'center',
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: '#e0e7ff',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    flexShrink: 0,
                  }}>
                    🛍️
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {item.productName}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: 14 }}>
                      ₹{item.unitPrice.toLocaleString()} per unit
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                      Quantity
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      background: '#f1f5f9',
                      borderRadius: 8,
                      fontWeight: 700,
                    }}>
                      {item.quantity}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <p style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#6366f1',
                    }}>
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
                      padding: 10,
                      borderRadius: 8,
                    }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="card" style={{ padding: 28, position: 'sticky', top: 80 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              Order Summary
            </h2>

            {cart.items.map(item => (
              <div key={item.productId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12,
                fontSize: 14,
              }}>
                <span style={{ color: '#64748b' }}>
                  {item.productName} × {item.quantity}
                </span>
                <span style={{ fontWeight: 600 }}>
                  ₹{item.totalPrice.toLocaleString()}
                </span>
              </div>
            ))}

            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 16,
              marginTop: 16,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 14,
              }}>
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span>₹{cart.totalCartPrice.toLocaleString()}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 14,
              }}>
                <span style={{ color: '#64748b' }}>Shipping</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 14,
              }}>
                <span style={{ color: '#64748b' }}>Tax (18% GST)</span>
                <span>₹{(cart.totalCartPrice * 0.18).toFixed(0)}</span>
              </div>
            </div>

            <div style={{
              borderTop: '2px solid #e2e8f0',
              paddingTop: 16,
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 24,
              fontSize: 20,
              fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ color: '#6366f1' }}>
                ₹{(cart.totalCartPrice * 1.18).toFixed(0)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Placing Order...' : (
                <>Place Order <ArrowRight size={16} /></>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16,
              fontSize: 13,
              color: '#64748b',
            }}>
              🔒 Secure checkout powered by JWT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;