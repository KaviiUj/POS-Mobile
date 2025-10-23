import React from 'react';
import VegIndicator from './VegIndicator';

const ItemInfo = ({ itemName, cuisine, discount, isVeg }) => {
  return (
    <div 
      className="w-full h-[148px] rounded-t-[25px]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="p-6">
        {/* Item Name with Veg Indicator */}
        <div className="flex items-center gap-2 mb-1">
          <VegIndicator isVeg={isVeg} />
          <h2 className="text-white text-[26px] font-semibold">
            {itemName}
          </h2>
        </div>
        
        {/* Cuisine */}
        {cuisine && (
          <p className="text-neutral-light text-[14px] font-normal">
            {cuisine}
          </p>
        )}
        
        {/* Discount */}
        {discount > 0 && (
          <p className="text-green-400 text-[16px] font-medium mt-6">
            {discount}% OFF
          </p>
        )}
      </div>
    </div>
  );
};

export default ItemInfo;

