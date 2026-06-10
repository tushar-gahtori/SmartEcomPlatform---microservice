import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { Product } from '../types';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Home'];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, sortDir]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let res;
      if (selectedCategory !== 'All') {
        res = await api.get(`/api/products/category/${selectedCategory}`);
        setProducts(res.data.data || []);
      } else {
        res = await api.get(`/api/products?page=0&size=50&sortBy=${sortBy}&sortDir=${sortDir}`);
        setProducts(res.data.data?.content || []);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '48px 0',
      }}>
        <div className="container">
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: 'white',
            marginBottom: 8,
          }}>
            All Products
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
            {products.length} products available
          </p>

          {/* Search */}
          <div style={{
            position: 'relative',
            maxWidth: 500,
            marginTop: 24,
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input"
              style={{
                paddingLeft: 48,
                paddingRight: search ? 48 : 16,
                background: 'white',
                fontSize: 15,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 32,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  border: '2px solid',
                  borderColor: selectedCategory === cat ? '#6366f1' : '#e2e8f0',
                  background: selectedCategory === cat ? '#6366f1' : 'white',
                  color: selectedCategory === cat ? 'white' : '#64748b',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={e => {
              const [field, dir] = e.target.value.split('-');
              setSortBy(field);
              setSortDir(dir);
            }}
            className="input"
            style={{ width: 'auto', minWidth: 160 }}>
            <option value="id-asc">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
          </select>
        </div>

        {/* Results count */}
        {search && (
          <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>
            Showing {filtered.length} results for "{search}"
          </p>
        )}

        {/* Products Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              No products found
            </h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div className="grid-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;