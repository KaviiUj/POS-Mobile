import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      cartId: null,
      cart: null,
      setCartId: (cartId) => set({ cartId }),
      setCart: (cart) => set({ cart, cartId: cart.cartId }),
      clearCart: () => set({ cartId: null, cart: null }),
    }),
    {
      name: 'cart-storage',
    }
  )
);

