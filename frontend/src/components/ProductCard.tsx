import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
}

const FALLBACK_IMAGES: { [key: string]: string } = {
  Electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
  Furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  Clothing: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
  Books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80',
};

const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);

  const imageUrl = product.imageUrl?.startsWith('http')
    ? product.imageUrl
    : FALLBACK_IMAGES[product.category] || FALLBACK_IMAGES.default;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <div className="card fade-in" style={{
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}>

        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                FALLBACK_IMAGES[product.category] || FALLBACK_IMAGES.default;
            }}
          />
          {/* Category badge */}
          <span className="badge badge-purple" style={{
            position: 'absolute',
            top: 12,
            left: 12,
          }}>
            {product.category}
          </span>

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
                background: '#ef4444',
                padding: '6px 16px',
                borderRadius: 20,
              }}>
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: 16 }}>
          <h3 style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {product.name}
          </h3>

          <p style={{
            fontSize: 13,
            color: '#64748b',
            marginBottom: 12,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {product.description}
          </p>

          {/* Rating (decorative) */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={12} fill={s <= 4 ? '#f59e0b' : '#e2e8f0'}
                color={s <= 4 ? '#f59e0b' : '#e2e8f0'} />
            ))}
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>
              (4.0)
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#6366f1',
              }}>
                ₹{product.price.toLocaleString()}
              </span>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : 'Out of stock'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={(e) => { e.preventDefault(); }}
                className="btn btn-outline btn-sm">
                <Eye size={14} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
                className="btn btn-primary btn-sm">
                {adding ? '...' : <ShoppingCart size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;