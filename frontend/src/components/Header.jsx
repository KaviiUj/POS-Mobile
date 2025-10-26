import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletStore } from '../store/outletStore';
import { useCartStore } from '../store/cartStore';

const Header = () => {
  const navigate = useNavigate();
  const { logo, outletName } = useOutletStore();
  const { getTotalItems } = useCartStore();
  const [hasOrders, setHasOrders] = useState(false);
  
  // Get item count from cart
  const itemCount = getTotalItems();

  // Check if user has any orders locally
  useEffect(() => {
    const checkOrders = () => {
      try {
        const orderIds = JSON.parse(localStorage.getItem('orderIds') || '[]');
        setHasOrders(orderIds.length > 0);
      } catch (error) {
        console.error('Error checking local orders:', error);
        setHasOrders(false);
      }
    };

    checkOrders();

    // Listen for order placed event to refresh orders check
    const handleOrderPlaced = () => {
      checkOrders();
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);

    return () => {
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, []);

  return (
    <div className="flex items-center justify-between mb-8">
      {/* Left: Logo and Restaurant Name */}
      <div className="flex items-center">
        {/* Logo */}
        {logo && (
          <div className="mr-4">
            <img 
              src={logo} 
              alt="Restaurant Logo" 
              className="w-[60px] h-[60px] object-contain rounded-lg"
            />
          </div>
        )}
        
        {/* Restaurant Name */}
        <h1 className="text-[25px] font-semibold text-white">
          {outletName || 'Restaurant'}
        </h1>
      </div>
      
      {/* Right: Icons */}
      <div className="flex items-center space-x-4">
        {/* Cart Icon with Badge */}
        <div className="relative">
          <button 
            onClick={() => navigate('/cart')}
            className="relative"
          >
            {/* Cart Icon */}
            <svg 
              className="w-8 h-8 text-accent" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            
            {/* Badge */}
            {itemCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </div>
            )}
          </button>
        </div>
        
        {/* My Orders Icon - Only show if user has orders */}
        {hasOrders && (
          <button 
            onClick={() => navigate('/orders')}
            className="relative"
          >
            {/* Orders Icon */}
            <svg 
              className="w-8 h-8 text-accent" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;

