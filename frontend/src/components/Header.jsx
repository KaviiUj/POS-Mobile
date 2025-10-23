import React from 'react';
import { useOutletStore } from '../store/outletStore';
import { useCartStore } from '../store/cartStore';

const Header = () => {
  const { logo, outletName } = useOutletStore();
  const { cart } = useCartStore();
  
  // Get item count from cart
  const itemCount = cart?.items?.length || 0;

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
      
      {/* Right: Cart Icon with Badge */}
      <div className="relative">
        <button className="relative">
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
          <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Header;

