import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useOutletStore } from '../store/outletStore';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import CartItem from '../components/CartItem';
import Button from '../components/Button';
import PinVerificationModal from '../components/PinVerificationModal';

const Cart = () => {
  const navigate = useNavigate();
  const { cartId, cart, setCart, getTotalPrice, clearCart, updateItemModifiers, updateItemQuantity, itemModifiers, itemQuantities } = useCartStore();
  const { outletConfig } = useOutletStore();
  const { accessToken, customer } = useAuthStore();
  const { tableNumber, tableId, tableName } = useTableStore();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [showPinModal, setShowPinModal] = useState(false);
  
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
    setShowPinModal(true);
  };

  const handlePinVerify = async (enteredPin) => {
    setShowPinModal(false);
    
    try {
      // Prepare order data with sessionPin
      const orderData = await prepareOrderData(enteredPin);
      
      // Call the place order API
      const response = await orderService.placeOrder(orderData);
      
        if (response.success) {
          console.log('Order placed successfully:', response.data);
          
          // Store orderId locally only if it's a new order (not an update)
          if (!response.data.isUpdate) {
            const existingOrderIds = JSON.parse(localStorage.getItem('orderIds') || '[]');
            existingOrderIds.push(response.data.orderId);
            localStorage.setItem('orderIds', JSON.stringify(existingOrderIds));
          }
          
          // Clear the cart after successful order placement
          clearCart();
          setCartItems([]);
          
          // Show success message
          const message = response.data.isUpdate 
            ? `Items added to order successfully! Order Number: ${response.data.orderNumber}`
            : `Order placed successfully! Order Number: ${response.data.orderNumber}`;
          alert(message);
          
          // Trigger a custom event to refresh the header
          window.dispatchEvent(new CustomEvent('orderPlaced'));
          
          // Navigate back to home
          navigate('/home');
        } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
      throw error;
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
  };

  const prepareOrderData = async (sessionPin) => {
    // Get cart items with modifiers and quantities
    const items = cartItems.map((item, index) => {
      const uniqueKey = `${item.itemId}_${index}`;
      const modifierData = itemModifiers[uniqueKey];
      const selectedModifiers = modifierData?.selectedModifiers || [];
      const modifierPrice = modifierData?.totalModifierPrice || 0;
      const quantity = itemQuantities[uniqueKey] || 1;
      
      // Calculate item price with discount
      const basePrice = item.price || 0;
      const discount = item.discount || 0;
      const finalPrice = discount > 0 
        ? basePrice - (basePrice * discount / 100)
        : basePrice;
      
      return {
        itemId: item.itemId,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        itemImage: item.itemImage,
        isVeg: item.isVeg,
        price: finalPrice,
        discount: discount,
        modifiers: selectedModifiers,
        modifierPrice: modifierPrice,
        quantity: quantity,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });

    const totalAmount = getTotalPrice();
    const discountAmount = cartItems.reduce((total, item) => {
      const itemDiscount = item.discount || 0;
      const basePrice = item.price || 0;
      return total + (basePrice * itemDiscount / 100);
    }, 0);

    return {
      items: items,
      totalItems: items.length,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      tableId: tableId,
      tableName: tableName,
      userId: customer?.userId || null,
      mobileNumber: customer?.mobileNumber || null,
      billIsSettle: false,
      cartId: cartId,
      sessionPin: sessionPin // Include the session PIN for backend validation
    };
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
          Continue
        </Button>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        tableNumber={tableNumber}
      />
    </div>
  );
};

export default Cart;
