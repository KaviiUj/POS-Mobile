import React from 'react';
import { useOutletStore } from '../store/outletStore';

const Header = () => {
  const { logo, outletName } = useOutletStore();

  return (
    <div className="flex items-center justify-center mb-8">
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
  );
};

export default Header;

