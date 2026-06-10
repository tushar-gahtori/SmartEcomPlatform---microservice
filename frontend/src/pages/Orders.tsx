import React, { useState, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Order } from '../types';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'badge-success',
  PENDING: 'badge-warning',
  CANCELLED: 'badge-danger',
  SHIPPED: 'badge-info',
  DELIVERED: 'badge-purple',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders/my-orders');
      setOrders(res.data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: number) => {
    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch {
      toast.error('Cannot cancel this order');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '48px 0',
      }}>
        <div className="container">
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>
            My Orders
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
            {orders.length} orders total
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={80} color="#e2e8f0" style={{ margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              No orders yet
            </h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
              Start shopping to see your orders here
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.orderId} className="card" style={{ overflow: 'hidden' }}>
                {/* Order Header */}
                <div
                  onClick={() => setExpanded(
                    expanded === order.orderId ? null : order.orderId
                  )}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: expanded === order.orderId ? '#f8fafc' : 'white',
                    borderBottom: expanded === order.orderId
                      ? '1px solid #e2e8f0' : 'none',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: '#e0e7ff',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Package size={22} color="#6366f1" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15 }}>
                        Order #{order.orderId}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#64748b',
                        fontSize: 13,
                        marginTop: 4,
                      }}>
                        <Calendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}>
                    <span className={`badge ${STATUS_COLORS[order.status] || 'badge-info'}`}>
                      {order.status}
                    </span>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#6366f1',
                    }}>
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                    {expanded === order.orderId
                      ? <ChevronUp size={18} color="#64748b" />
                      : <ChevronDown size={18} color="#64748b" />}
                  </div>
                </div>

                {/* Order Items */}
                {expanded === order.orderId && (
                  <div style={{ padding: '20px 24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          {['Product', 'Qty', 'Price', 'Total'].map(h => (
                            <th key={h} style={{
                              textAlign: 'left',
                              padding: '8px 12px',
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#64748b',
                              textTransform: 'uppercase',
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: 600 }}>
                              {item.productName}
                            </td>
                            <td style={{ padding: '12px', color: '#64748b' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '12px', color: '#64748b' }}>
                              ₹{item.priceAtPurchase.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#6366f1' }}>
                              ₹{(item.priceAtPurchase * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 20,
                      paddingTop: 20,
                      borderTop: '2px solid #e2e8f0',
                    }}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 800,
                      }}>
                        Total:{' '}
                        <span style={{ color: '#6366f1' }}>
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => cancelOrder(order.orderId)}
                          className="btn btn-danger btn-sm">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;