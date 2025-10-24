import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { cartService } from '../services/cartService';
import CartItem from '../components/CartItem';
import Button from '../components/Button';

const Cart = () => {
  const navigate = useNavigate();
  const { cartId, cart, setCart, getTotalPrice, clearCart, updateItemModifiers, updateItemQuantity } = useCartStore();
  const { outletConfig } = useOutletStore();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  
  const currency = outletConfig?.outletCurrency || outletConfig?.currency || 'Rs';
  
  // Debug: Log outlet config to see what's actually stored
  console.log('Outlet config:', outletConfig);
  console.log('Currency being used:', currency);
  console.log('🔑 Access Token:', accessToken);

  const formatPrice = (price) => {
    return price.toFixed(2);
  };

  const totalPrice = getTotalPrice();

  // Fetch cart items from API
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!cartId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await cartService.getCart(cartId);
        console.log('🔍 Cart API Response:', response);
        console.log('🔍 Cart items:', response.data?.items);
        
        if (response.success) {
          setCart(response.data);
          setCartItems(response.data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch cart items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [cartId, setCart]);

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    console.log('Proceeding to checkout...');
  };

  const handleClearCart = async () => {
    if (!cartId) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Do you want to clear cart?'
    );

    if (!confirmed) return;

    try {
      const response = await cartService.deleteCart(cartId);
      
      if (response.success) {
        // Clear local cart state
        clearCart();
        setCartItems([]);
        console.log('Cart cleared successfully');
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!cartId) return;

    try {
      const response = await cartService.deleteItem(cartId, itemId);
      
      if (response.success) {
        // Refresh cart items after deletion
        const cartResponse = await cartService.getCart(cartId);
        if (cartResponse.success) {
          setCart(cartResponse.data);
          setCartItems(cartResponse.data.items || []);
        }
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleModifierChange = (itemId, selectedModifiers, totalModifierPrice) => {
    console.log('Modifier changed for item:', itemId);
    console.log('Selected modifiers:', selectedModifiers);
    console.log('Total modifier price:', totalModifierPrice);
    
    // Update modifiers in cart store
    updateItemModifiers(itemId, selectedModifiers, totalModifierPrice);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    console.log('Quantity changed for item:', itemId);
    console.log('New quantity:', newQuantity);
    
    // Update quantity in cart store
    updateItemQuantity(itemId, newQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-background-secondary">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold">Cart</h1>
          <div className="w-8"></div>
        </div>

        {/* Loading */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-neutral-light">Loading cart...</div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-background-secondary">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold">Cart</h1>
          <div className="w-8"></div>
        </div>

        {/* Empty Cart */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-neutral-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-neutral-light text-center mb-6">
            Add some delicious items to get started
          </p>
          <Button onClick={() => navigate('/home')}>
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background-primary flex flex-col">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-6 bg-background-secondary flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-semibold">Cart</h1>
        <button
          onClick={handleClearCart}
          className="text-accent text-sm font-medium"
        >
          Clear
        </button>
      </div>

             {/* Scrollable Cart Items */}
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {cartItems.map((item, index) => (
                 <CartItem
                   key={`${item.itemId}_${index}`}
                   item={item}
                   itemIndex={index}
                   onDelete={handleDeleteItem}
                   onModifierChange={handleModifierChange}
                   onQuantityChange={handleQuantityChange}
                 />
               ))}
             </div>

      {/* Fixed Footer */}
      <div className="p-6 bg-background-secondary border-t border-neutral-dark flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-lg font-semibold">Total</span>
          <span className="text-white text-lg font-semibold">
            {currency} {formatPrice(totalPrice)}
          </span>
        </div>
        <Button onClick={handleCheckout} className="w-full">
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default Cart;
