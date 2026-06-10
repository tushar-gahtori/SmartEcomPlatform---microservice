import React from 'react';
import { Link } from 'react-router-dom';

const ProductDetail: React.FC = () => {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>Product Detail</h2>
      <Link to="/products">Back to Products</Link>
    </div>
  );
};

export default ProductDetail;