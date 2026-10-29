import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price_at_transaction: product.selling_price,
          cost_at_transaction: product.cost_price,
          qty: 1,
          notes: '',
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product_id === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const updateNotes = (productId, notes) => {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, notes } : i))
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => setItems([]);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price_at_transaction * item.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, updateNotes, removeItem, clearCart, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

