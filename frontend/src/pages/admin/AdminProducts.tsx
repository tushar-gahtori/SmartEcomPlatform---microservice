import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { Product } from '../../types';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', description: '', category: 'Electronics',
  imageUrl: '', price: 0, stock: 0,
};

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products?page=0&size=100');
      setProducts(res.data.data?.content || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      imageUrl: p.imageUrl || '',
      price: p.price,
      stock: p.stock,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/api/products', form);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        padding: '48px 0',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>
              Product Management
            </h1>
            <p style={{ color: '#94a3b8', marginTop: 4 }}>
              {products.length} products total
            </p>
          </div>
          <button onClick={openCreate} className="btn btn-primary btn-lg">
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
          <Search size={16} style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
          }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input"
            style={{ paddingLeft: 44 }}
          />
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Product', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: i % 2 === 0 ? 'white' : '#fafbfc',
                    transition: 'background 0.2s',
                  }}
                    onMouseEnter={e =>
                      (e.currentTarget as HTMLTableRowElement).style.background = '#f0f4ff'}
                    onMouseLeave={e =>
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        i % 2 === 0 ? 'white' : '#fafbfc'}>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: 12,
                        marginTop: 2,
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.description}
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-purple">{p.category}</span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 700, color: '#6366f1' }}>
                        ₹{p.price.toLocaleString()}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${
                        p.stock === 0 ? 'badge-danger' :
                        p.stock < 10 ? 'badge-warning' : 'badge-success'
                      }`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openEdit(p)}
                          className="btn btn-outline btn-sm">
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="btn btn-danger btn-sm">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 24px',
                color: '#64748b',
              }}>
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 300,
              backdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: 20,
            padding: 36,
            width: 520,
            maxWidth: '90vw',
            zIndex: 301,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 28,
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                {editing ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}>
              {[
                { field: 'name', label: 'Product Name', span: true,
                  type: 'text', placeholder: 'MacBook Pro' },
                { field: 'category', label: 'Category', span: false,
                  type: 'select' },
                { field: 'price', label: 'Price (₹)', span: false,
                  type: 'number', placeholder: '1999.99' },
                { field: 'stock', label: 'Stock', span: false,
                  type: 'number', placeholder: '100' },
                { field: 'imageUrl', label: 'Image URL', span: true,
                  type: 'text', placeholder: 'https://example.com/image.jpg' },
                { field: 'description', label: 'Description', span: true,
                  type: 'textarea', placeholder: 'Product description...' },
              ].map(({ field, label, span, type, placeholder }) => (
                <div key={field} style={{ gridColumn: span ? '1/-1' : 'auto' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: 6,
                    color: '#374151',
                  }}>
                    {label}
                  </label>

                  {type === 'select' ? (
                    <select
                      value={(form as any)[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className="input">
                      {['Electronics', 'Furniture', 'Clothing', 'Books',
                        'Sports', 'Home'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea
                      value={(form as any)[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      placeholder={placeholder}
                      className="input"
                      rows={3}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <input
                      type={type}
                      value={(form as any)[field]}
                      onChange={e => setForm({
                        ...form,
                        [field]: type === 'number'
                          ? parseFloat(e.target.value) || 0
                          : e.target.value
                      })}
                      placeholder={placeholder}
                      className="input"
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 28,
            }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}>
                {saving ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProducts;