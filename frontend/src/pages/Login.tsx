import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, role } = res.data.data;
      const userRes = await api.get('/api/users/1',
        { headers: { Authorization: `Bearer ${token}` } });
      login(token, { ...userRes.data.data, role });
      toast.success('Welcome back!');
      navigate('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Demo login
  const demoLogin = async (role: 'user' | 'admin') => {
    setEmail(role === 'admin' ? 'admin@smartstore.com' : 'user@smartstore.com');
    setPassword('password123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 24,
            fontWeight: 800,
            color: '#6366f1',
            textDecoration: 'none',
          }}>
            <Zap size={28} fill="#6366f1" />
            SmartStore
          </Link>
        </div>

        <div className="card" style={{ padding: 40 }}>
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Welcome back
          </h1>
          <p style={{
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 32,
            fontSize: 15,
          }}>
            Sign in to your account
          </p>

          {/* Demo buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 24,
          }}>
            <button
              onClick={() => demoLogin('user')}
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'center' }}>
              Demo User
            </button>
            <button
              onClick={() => demoLogin('admin')}
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'center', borderColor: '#f59e0b', color: '#f59e0b' }}>
              Demo Admin
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 8,
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input"
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input"
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            color: '#64748b',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6366f1', fontWeight: 600 }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;