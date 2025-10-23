import React from 'react';
import { useOutletStore } from '../store/outletStore';

const ItemFooter = ({ item, onAddToCart }) => {
  const { outletCurrency } = useOutletStore();
  
  // Calculate pricing
  const originalPrice = item.price;
  const hasDiscount = item.discount > 0;
  const discountAmount = hasDiscount ? (originalPrice * item.discount) / 100 : 0;
  const finalPrice = hasDiscount ? originalPrice - discountAmount : originalPrice;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-primary border-t border-border-secondary">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Price Section */}
        <div className="flex-1">
          <p className="text-neutral-light text-[12px] font-normal mb-1">
            Price
          </p>
          <div className="flex items-baseline">
            {hasDiscount ? (
              <>
                {/* Original Price - Crossed out */}
                <span className="text-neutral-medium text-[16px] font-semibold line-through mr-2">
                  {outletCurrency || '$'} {originalPrice.toFixed(2)}
                </span>
                {/* Final Price */}
                <span className="text-accent text-[18px] font-semibold">
                  {outletCurrency || '$'}
                </span>
                <span className="text-white text-[18px] font-semibold ml-1">
                  {finalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                {/* Regular Price */}
                <span className="text-accent text-[18px] font-semibold">
                  {outletCurrency || '$'}
                </span>
                <span className="text-white text-[18px] font-semibold ml-1">
                  {originalPrice.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={onAddToCart}
          className="bg-accent text-white px-5 py-2.5 rounded-2xl font-semibold text-[13px] hover:bg-opacity-90 transition-all"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ItemFooter;
