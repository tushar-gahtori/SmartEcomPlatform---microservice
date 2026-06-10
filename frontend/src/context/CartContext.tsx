import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import api from '../api/axios';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/api/cart');
      setCart(res.data.data);
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated) refreshCart();
    else setCart(null);
  }, [isAuthenticated]);

  const addToCart = async (productId: number, quantity: number) => {
    await api.post(`/api/cart/add?productId=${productId}&quantity=${quantity}`);
    await refreshCart();
    setIsOpen(true);
  };

  const removeFromCart = async (productId: number) => {
    await api.delete(`/api/cart/remove?productId=${productId}`);
    await refreshCart();
  };

  const clearCart = async () => {
    await api.delete('/api/cart/clear');
    await refreshCart();
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount: cart?.items?.length ?? 0,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addToCart,
      removeFromCart,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);