import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Zap } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/register', form);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
            Create account
          </h1>
          <p style={{
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 32,
            fontSize: 15,
          }}>
            Join thousands of happy shoppers
          </p>

          <form onSubmit={handleSubmit}>
            {[
              { field: 'name', label: 'Full Name', icon: <User size={16} />,
                type: 'text', placeholder: 'Tushar Gahtori' },
              { field: 'email', label: 'Email', icon: <Mail size={16} />,
                type: 'email', placeholder: 'you@example.com' },
              { field: 'password', label: 'Password', icon: <Lock size={16} />,
                type: 'password', placeholder: 'Min 8 characters' },
            ].map(({ field, label, icon, type, placeholder }) => (
              <div key={field} style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 8,
                }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}>
                    {icon}
                  </div>
                  <input
                    type={type}
                    value={(form as any)[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    placeholder={placeholder}
                    required
                    className="input"
                    style={{ paddingLeft: 44 }}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            color: '#64748b',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;