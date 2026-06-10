import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Zap, Shield, Truck, Star,
         ArrowRight, Package, Users, TrendingUp } from 'lucide-react';

const FEATURED_CATEGORIES = [
  { name: 'Electronics', icon: '💻', color: '#dbeafe', items: 142 },
  { name: 'Furniture', icon: '🪑', color: '#dcfce7', items: 89 },
  { name: 'Clothing', icon: '👕', color: '#fce7f3', items: 215 },
  { name: 'Books', icon: '📚', color: '#fef3c7', items: 340 },
  { name: 'Sports', icon: '⚽', color: '#e0e7ff', items: 127 },
  { name: 'Home', icon: '🏡', color: '#fde8d8', items: 93 },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Frequent Shopper',
    text: 'Amazing platform! Fast delivery and great product quality.',
    avatar: 'PS',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'Tech Enthusiast',
    text: 'Best prices for electronics. Highly recommended!',
    avatar: 'RV',
    rating: 5,
  },
  {
    name: 'Anjali Singh',
    role: 'Home Decorator',
    text: 'Love the furniture collection. Premium quality at great prices.',
    avatar: 'AS',
    rating: 4,
  },
];

const Landing: React.FC = () => {
  return (
    <div style={{ background: 'white' }}>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        padding: '80px 0 100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -150,
          left: -50,
          width: 300,
          height: 300,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
        }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60,
            alignItems: 'center',
          }}>
            <div className="fade-in">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 24,
              }}>
                <Zap size={14} fill="white" />
                Built with Spring Boot Microservices
              </div>

              <h1 style={{
                fontSize: 52,
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.2,
                marginBottom: 20,
              }}>
                Shop Smarter,<br />
                <span style={{ color: '#fbbf24' }}>Live Better</span>
              </h1>

              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.85)',
                marginBottom: 40,
                lineHeight: 1.7,
              }}>
                Discover thousands of products across all categories.
                Fast delivery, secure payments, and amazing deals every day.
              </p>

              <div style={{ display: 'flex', gap: 16 }}>
                <Link to="/products" className="btn btn-lg" style={{
                  background: 'white',
                  color: '#6366f1',
                  fontWeight: 700,
                }}>
                  <ShoppingBag size={18} />
                  Shop Now
                  <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn btn-lg" style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}>
                  Get Started Free
                </Link>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: 40,
                marginTop: 48,
              }}>
                {[
                  { icon: <Package size={20} />, value: '10K+', label: 'Products' },
                  { icon: <Users size={20} />, value: '50K+', label: 'Customers' },
                  { icon: <TrendingUp size={20} />, value: '99%', label: 'Satisfaction' },
                ].map((stat, i) => (
                  <div key={i} style={{ color: 'white' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: 0.8,
                      marginBottom: 4,
                    }}>
                      {stat.icon}
                      <span style={{ fontSize: 13 }}>{stat.label}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 40,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <div style={{ fontSize: 120 }}>🛍️</div>
                <p style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 16,
                  fontWeight: 600,
                  marginTop: 16,
                }}>
                  Your one-stop shop for everything
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
              Why Choose SmartStore?
            </h2>
            <p style={{ color: '#64748b', fontSize: 16 }}>
              Built on production-grade microservices architecture
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
          }}>
            {[
              {
                icon: <Truck size={28} color="#6366f1" />,
                title: 'Free Delivery',
                desc: 'Free shipping on all orders above ₹500',
                color: '#e0e7ff',
              },
              {
                icon: <Shield size={28} color="#10b981" />,
                title: 'Secure Payments',
                desc: 'JWT-secured transactions with bank-level encryption',
                color: '#dcfce7',
              },
              {
                icon: <Zap size={28} color="#f59e0b" />,
                title: 'Lightning Fast',
                desc: 'Redis-cached responses for instant product loads',
                color: '#fef3c7',
              },
              {
                icon: <Star size={28} color="#ef4444" />,
                title: 'Top Quality',
                desc: 'Curated products from verified sellers only',
                color: '#fee2e2',
              },
            ].map((f, i) => (
              <div key={i} className="card fade-in" style={{ padding: 32 }}>
                <div style={{
                  width: 60,
                  height: 60,
                  background: f.color,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 48,
          }}>
            <div>
              <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
                Shop by Category
              </h2>
              <p style={{ color: '#64748b' }}>Find exactly what you're looking for</p>
            </div>
            <Link to="/products" className="btn btn-outline">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
          }}>
            {FEATURED_CATEGORIES.map((cat, i) => (
              <Link key={i}
                to={`/products?category=${cat.name}`}
                style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  padding: 24,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = '';
                    (e.currentTarget as HTMLDivElement).style.borderColor = '';
                  }}>
                  <div style={{
                    fontSize: 40,
                    marginBottom: 12,
                    background: cat.color,
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    {cat.icon}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                    {cat.name}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {cat.items} items
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
              What Our Customers Say
            </h2>
          </div>

          <div className="grid-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card fade-in" style={{ padding: 32 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p style={{
                  color: '#475569',
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginBottom: 24,
                  fontStyle: 'italic',
                }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{
            fontSize: 40,
            fontWeight: 800,
            color: 'white',
            marginBottom: 16,
          }}>
            Ready to Start Shopping?
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 18,
            marginBottom: 40,
          }}>
            Join thousands of happy customers today.
          </p>
          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}>
            <Link to="/register" className="btn btn-lg" style={{
              background: 'white',
              color: '#6366f1',
              fontWeight: 700,
            }}>
              Create Free Account
            </Link>
            <Link to="/products" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0f172a',
        color: '#94a3b8',
        padding: '48px 0 24px',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 40,
            marginBottom: 40,
          }}>
            <div>
              <div style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'white',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Zap size={20} fill="#6366f1" color="#6366f1" />
                SmartStore
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                A production-grade e-commerce platform built with
                Spring Boot microservices.
              </p>
            </div>
            {[
              {
                title: 'Shop',
                links: ['All Products', 'Electronics', 'Furniture', 'Clothing'],
              },
              {
                title: 'Account',
                links: ['Login', 'Register', 'My Orders', 'Profile'],
              },
              {
                title: 'Tech Stack',
                links: ['Spring Boot', 'React TypeScript', 'Kafka', 'Redis'],
              },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{
                  color: 'white',
                  fontWeight: 700,
                  marginBottom: 16,
                  fontSize: 15,
                }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none' }}>
                  {col.links.map((link, j) => (
                    <li key={j} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 14, cursor: 'pointer' }}
                        onMouseEnter={e =>
                          (e.target as HTMLElement).style.color = 'white'}
                        onMouseLeave={e =>
                          (e.target as HTMLElement).style.color = ''}>
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: 24,
            textAlign: 'center',
            fontSize: 14,
          }}>
            © 2025 SmartStore. Built with ❤️ using Spring Boot Microservices.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;