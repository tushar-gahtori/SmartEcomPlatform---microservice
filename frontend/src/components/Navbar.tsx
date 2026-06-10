import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard,
         Package, Menu, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          fontSize: 20,
          fontWeight: 800,
          color: '#6366f1',
        }}>
          <Zap size={24} fill="#6366f1" />
          SmartStore
        </Link>

        {/* Desktop Nav */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Link to="/products" className="btn btn-outline"
            style={{ padding: '8px 16px' }}>
            <Package size={16} />
            Products
          </Link>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="btn btn-outline"
                  style={{ padding: '8px 16px' }}>
                  <LayoutDashboard size={16} />
                  Admin
                </Link>
              )}

              <button onClick={openCart} className="btn btn-outline"
                style={{ padding: '8px 16px', position: 'relative' }}>
                <ShoppingCart size={16} />
                Cart
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>

              <Link to="/orders" className="btn btn-outline"
                style={{ padding: '8px 16px' }}>
                <Package size={16} />
                Orders
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: '#6366f1',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {user?.name}
                </span>
                {isAdmin && (
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>
                    ADMIN
                  </span>
                )}
              </div>

              <button onClick={handleLogout} className="btn btn-danger"
                style={{ padding: '8px 12px' }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline"
                style={{ padding: '8px 20px' }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary"
                style={{ padding: '8px 20px' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;