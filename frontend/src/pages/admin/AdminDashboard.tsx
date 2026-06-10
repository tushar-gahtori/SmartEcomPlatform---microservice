import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, TrendingUp,
         ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    orders: 0,
    revenue: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          api.get('/api/products?page=0&size=1'),
          api.get('/api/users'),
          api.get('/api/orders/my-orders'),
        ]);

        const orders = ordersRes.data.data || [];
        const revenue = orders.reduce(
          (sum: number, o: any) => sum + o.totalAmount, 0
        );

        setStats({
          products: productsRes.data.data?.totalElements || 0,
          users: usersRes.data.data?.length || 0,
          orders: orders.length,
          revenue,
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.products,
      icon: <Package size={24} />,
      color: '#e0e7ff',
      iconColor: '#6366f1',
      change: '+12%',
    },
    {
      title: 'Total Users',
      value: stats.users,
      icon: <Users size={24} />,
      color: '#dcfce7',
      iconColor: '#10b981',
      change: '+8%',
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: <ShoppingCart size={24} />,
      color: '#fef3c7',
      iconColor: '#f59e0b',
      change: '+23%',
    },
    {
      title: 'Revenue',
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: <TrendingUp size={24} />,
      color: '#fee2e2',
      iconColor: '#ef4444',
      change: '+18%',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        padding: '48px 0',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              background: '#6366f1',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: 'white',
            }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>
                Admin Dashboard
              </h1>
              <p style={{ color: '#94a3b8', marginTop: 4 }}>
                Welcome back, {user?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
          marginBottom: 40,
        }}>
          {statCards.map((s, i) => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  background: s.color,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: s.iconColor,
                }}>
                  {s.icon}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#10b981',
                  background: '#dcfce7',
                  padding: '3px 8px',
                  borderRadius: 20,
                }}>
                  {s.change}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                {s.title}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}>
          {[
            {
              title: 'Manage Products',
              desc: 'Add, edit and remove products',
              icon: '📦',
              link: '/admin/products',
              color: '#e0e7ff',
            },
            {
              title: 'View All Orders',
              desc: 'See all customer orders',
              icon: '📋',
              link: '/orders',
              color: '#dcfce7',
            },
            {
              title: 'Browse Store',
              desc: 'View store as customer',
              icon: '🛒',
              link: '/products',
              color: '#fef3c7',
            },
          ].map((action, i) => (
            <Link key={i} to={action.link} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: 24,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '';
                }}>
                <div style={{
                  fontSize: 32,
                  marginBottom: 12,
                  background: action.color,
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {action.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {action.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: 13 }}>{action.desc}</p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 16,
                  color: '#6366f1',
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  Go <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* System Status */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          System Status
        </h2>
        <div className="card" style={{ padding: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {[
              { name: 'API Gateway', port: 8080, status: 'UP' },
              { name: 'User Service', port: 8081, status: 'UP' },
              { name: 'Product Service', port: 8082, status: 'UP' },
              { name: 'Order Service', port: 8083, status: 'UP' },
              { name: 'Notification', port: 8084, status: 'UP' },
              { name: 'Kafka', port: 9092, status: 'UP' },
            ].map((svc, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{svc.name}</p>
                  <p style={{ color: '#64748b', fontSize: 11 }}>:{svc.port}</p>
                </div>
                <span className="badge badge-success" style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                }}>
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;