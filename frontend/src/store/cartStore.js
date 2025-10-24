import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartId: null,
      cart: null,
      itemModifiers: {}, // Track modifiers for each item: { itemId: { selectedModifiers: [], totalModifierPrice: 0 } }
      itemQuantities: {}, // Track quantities for each item: { itemId: quantity }
      setCartId: (cartId) => set({ cartId }),
      setCart: (cart) => set({ cart, cartId: cart.cartId }),
      clearCart: () => set({ 
        cartId: null, 
        cart: null, 
        itemModifiers: {},
        itemQuantities: {}
      }),
      
      // Update modifiers for a specific item
      updateItemModifiers: (itemId, selectedModifiers, totalModifierPrice) => {
        const { itemModifiers } = get();
        set({
          itemModifiers: {
            ...itemModifiers,
            [itemId]: {
              selectedModifiers,
              totalModifierPrice
            }
          }
        });
      },

      // Update quantity for a specific item
      updateItemQuantity: (itemId, quantity) => {
        const { itemQuantities } = get();
        set({
          itemQuantities: {
            ...itemQuantities,
            [itemId]: quantity
          }
        });
      },
      
      // Get total items count from cart data
      getTotalItems: () => {
        const { cart } = get();
        return cart?.items?.length || 0;
      },
      
      // Get total price from cart data including modifiers and quantities
      getTotalPrice: () => {
        const { cart, itemModifiers, itemQuantities } = get();
        if (!cart?.items) return 0;
        
        return cart.items.reduce((total, item, index) => {
          const finalPrice = item.discount > 0 
            ? item.price - (item.price * item.discount / 100)
            : item.price;
          
          // Add modifier price if item has modifiers
          const uniqueKey = `${item.itemId}_${index}`;
          const modifierData = itemModifiers[uniqueKey];
          const modifierPrice = modifierData?.totalModifierPrice || 0;
          
          // Get quantity for this item (default to 1 if not set)
          const quantity = itemQuantities[uniqueKey] || 1;
          
          return total + (finalPrice + modifierPrice) * quantity;
        }, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);

