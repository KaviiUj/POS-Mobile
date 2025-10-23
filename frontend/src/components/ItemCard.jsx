import React from 'react';
import { useOutletStore } from '../store/outletStore';
import Discount from './Discount';

const ItemCard = ({ item, onAddToCart, onItemClick, isLarge = false, isSmall = false }) => {
  const { outletCurrency } = useOutletStore();
  
  // Create varying heights for masonry effect - deterministic based on item ID
  const getCardHeight = () => {
    if (isLarge) return 350;
    if (isSmall) return 180;
    
    // Use itemId to generate consistent height
    const heights = [200, 220, 240, 260, 280, 300];
    const hash = item.itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return heights[hash % heights.length];
  };
  
  const cardHeight = getCardHeight();

  const formatPrice = (price) => {
    // Convert cents to currency format without decimals
    const formattedPrice = Math.round(price / 100);
    return `${outletCurrency || '$'} ${formattedPrice}`;
  };

  // Calculate discounted price if discount exists
  const getDiscountedPrice = () => {
    if (item.discount && item.discount > 0) {
      const originalPrice = item.price / 100;
      const discountAmount = (originalPrice * item.discount) / 100;
      return Math.round(originalPrice - discountAmount);
    }
    return null;
  };

  const discountedPrice = getDiscountedPrice();

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const handleCardClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`${isLarge ? 'w-full' : isSmall ? 'w-[120px]' : 'w-[149px]'} rounded-[23px] relative overflow-hidden cursor-pointer`}
      style={{
        height: `${cardHeight}px`,
        backgroundImage: 'url(/src/assets/item-surface.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Item Image */}
      <div className={`${isLarge ? 'mx-4 mt-4 mb-10' : isSmall ? 'mx-2 mt-2 mb-10' : 'mx-[12px] mt-[12px] mb-10'} relative`}>
        <img
          src={item.itemImage}
          alt={item.itemName}
          className={`${isLarge ? 'w-full' : isSmall ? 'w-[100px]' : 'w-[126px]'} rounded-[20px] object-cover`}
          style={{ height: `${isLarge ? cardHeight - 120 : cardHeight - 80}px` }}
        />
        {/* Discount Component */}
        <Discount 
          discount={item.discount} 
          isLarge={isLarge} 
          isSmall={isSmall} 
        />
      </div>

      {/* Item Details */}
      <div className={`absolute bottom-0 left-0 right-0 ${isLarge ? 'p-4 pb-6' : isSmall ? 'p-2' : 'p-3'}`}>
        {/* Item Name */}
        <h3 className={`${isLarge ? 'text-[16px]' : isSmall ? 'text-[11px]' : 'text-[13px]'} font-normal text-white mb-1 line-clamp-1`}>
          {item.itemName}
        </h3>


        {/* Price and Add Button */}
        <div className="flex items-center justify-between">
          {/* Price */}
          <div className="flex items-baseline">
            <span className={`${isLarge ? 'text-[18px]' : 'text-[12px]'} font-semibold text-accent`}>
              {outletCurrency || '$'}
            </span>
            <span className={`${isLarge ? 'text-[18px]' : 'text-[12px]'} font-semibold text-white ml-1`}>
              {item.price.toFixed(2)}
            </span>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddToCart}
            className={`${isLarge ? 'w-[32px] h-[32px]' : isSmall ? 'w-[24px] h-[24px]' : 'w-[28px] h-[28px]'} bg-accent rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all`}
          >
            <span className={`text-white ${isLarge ? 'text-xl' : isSmall ? 'text-sm' : 'text-lg'} font-normal`}>+</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;

