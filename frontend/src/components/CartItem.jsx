import React, { useState, useEffect } from 'react';
import { useOutletStore } from '../store/outletStore';
import { useCartStore } from '../store/cartStore';

const CartItem = ({ item, onDelete, onModifierChange, onQuantityChange, itemIndex }) => {
  const { outletConfig } = useOutletStore();
  const { itemModifiers, itemQuantities, updateItemQuantity } = useCartStore();
  const currency = outletConfig?.outletCurrency || outletConfig?.currency || 'Rs';
  
  // Create unique key for this cart item instance (itemId + index)
  const uniqueItemKey = `${item.itemId}_${itemIndex}`;
  
  // Get stored modifiers for this specific item instance
  const storedModifierData = itemModifiers[uniqueItemKey];
  const [selectedModifiers, setSelectedModifiers] = useState(storedModifierData?.selectedModifiers || []);
  
  // Get stored quantity for this item (default to 1)
  const storedQuantity = itemQuantities[uniqueItemKey] || 1;
  const [quantity, setQuantity] = useState(storedQuantity);
  
  // Sync with stored modifiers when component mounts or item changes
  useEffect(() => {
    if (storedModifierData) {
      setSelectedModifiers(storedModifierData.selectedModifiers || []);
    }
  }, [storedModifierData]);

  // Sync with stored quantity when component mounts or item changes
  useEffect(() => {
    setQuantity(storedQuantity);
  }, [storedQuantity]);

  const formatPrice = (price) => {
    return price.toFixed(2);
  };

  // Handle modifier selection
  const handleModifierToggle = (modifier) => {
    const isSelected = selectedModifiers.some(selected => 
      selected.modifierName === modifier.modifierName
    );
    
    let newSelectedModifiers;
    if (isSelected) {
      // Remove modifier
      newSelectedModifiers = selectedModifiers.filter(selected => 
        selected.modifierName !== modifier.modifierName
      );
    } else {
      // Add modifier
      newSelectedModifiers = [...selectedModifiers, modifier];
    }
    
    setSelectedModifiers(newSelectedModifiers);
    
    // Calculate total modifier price
    const totalModifierPrice = newSelectedModifiers.reduce((total, mod) => 
      total + (mod.modifierPrice || 0), 0
    );
    
    // Notify parent component about modifier changes
    if (onModifierChange) {
      onModifierChange(uniqueItemKey, newSelectedModifiers, totalModifierPrice);
    }
  };

  // Check if modifier is selected
  const isModifierSelected = (modifier) => {
    return selectedModifiers.some(selected => 
      selected.modifierName === modifier.modifierName
    );
  };

  // Handle quantity increase
  const handleQuantityIncrease = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    
    // Update quantity in cart store
    updateItemQuantity(uniqueItemKey, newQuantity);
    
    // Notify parent component about quantity change
    if (onQuantityChange) {
      onQuantityChange(uniqueItemKey, newQuantity);
    }
  };

  // Handle quantity decrease
  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      
      // Update quantity in cart store
      updateItemQuantity(uniqueItemKey, newQuantity);
      
      // Notify parent component about quantity change
      if (onQuantityChange) {
        onQuantityChange(uniqueItemKey, newQuantity);
      }
    }
  };

  return (
    <div 
      className="rounded-[23px] p-3"
      style={{
        backgroundImage: 'url(/src/assets/item-surface.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Main Content Row */}
      <div className="flex items-center gap-3">
        {/* Item Image */}
        <div className="flex-shrink-0">
          <img
            src={item.itemImage}
            alt={item.itemName}
            className="w-[126px] h-[126px] rounded-[20px] object-cover"
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 flex flex-col">
          {/* Item Name and Subtitle */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white text-[15px] font-normal mb-1">
                  {item.itemName}
                </h3>
                <p className="text-neutral-light text-[9px] font-normal mb-[15px]">
                  {item.cuisine || 'With Steamed Milk'}
                </p>
              </div>
              
                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete && onDelete(item.itemId)}
                    className="ml-3 w-[25px] h-[25px] bg-[#252A32] rounded-[10px] flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <svg 
                      className="w-4 h-4 text-red-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                  </button>
            </div>
          </div>

          {/* Quantity Controls and Price */}
          <div className="flex flex-col items-start">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2 mb-2">
              {/* Minus Button */}
              <button
                onClick={handleQuantityDecrease}
                disabled={quantity <= 1}
                className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition-colors ${
                  quantity <= 1 
                    ? 'bg-neutral-medium cursor-not-allowed' 
                    : 'bg-accent hover:bg-accent/80'
                }`}
              >
                <span className={`text-[14px] font-medium ${
                  quantity <= 1 ? 'text-neutral-light' : 'text-white'
                }`}>-</span>
              </button>

              {/* Quantity Display */}
              <div className="w-7 h-7 bg-white border border-accent rounded-[7px] flex items-center justify-center">
                <span className="text-black text-[12px] font-medium">
                  {quantity}
                </span>
              </div>

              {/* Plus Button */}
              <button
                onClick={handleQuantityIncrease}
                className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-center hover:bg-accent/80 transition-colors"
              >
                <span className="text-white text-[14px] font-medium">+</span>
              </button>

              {/* Discount */}
              {item.discount > 0 && (
                <span className="text-green-500 text-[12px] font-semibold ml-2">
                  {item.discount}% OFF
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-1">
              {item.discount > 0 ? (
                <div className="flex items-center gap-2">
                  {/* Original Price - Crossed Out */}
                  <div className="flex items-center gap-1">
                    <span className="text-accent text-[15px] font-normal line-through">
                      {currency}
                    </span>
                    <span className="text-white text-[15px] font-normal line-through">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  {/* Discounted Price + Modifiers */}
                  <div className="flex items-center gap-1">
                    <span className="text-accent text-[15px] font-semibold">
                      {currency}
                    </span>
                    <span className="text-white text-[15px] font-semibold">
                      {formatPrice(
                        ((item.price - (item.price * item.discount / 100)) + 
                        selectedModifiers.reduce((total, mod) => total + (mod.modifierPrice || 0), 0)) * quantity
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-accent text-[15px] font-semibold">
                    {currency}
                  </span>
                  <span className="text-white text-[15px] font-semibold">
                    {formatPrice(
                      (item.price + 
                      selectedModifiers.reduce((total, mod) => total + (mod.modifierPrice || 0), 0)) * quantity
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modifiers Section - Separate row, starts from beginning */}
      {item.modifiers && item.modifiers.length > 0 && (
        <div className="w-full mt-3">
          <h4 className="text-neutral-light text-[12px] font-semibold mb-2">
            Modifiers
          </h4>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {item.modifiers.map((modifier, index) => {
              const isSelected = isModifierSelected(modifier);
              
              return (
                <button
                  key={index}
                  onClick={() => handleModifierToggle(modifier)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-accent text-white border border-accent'
                      : 'bg-background-secondary border border-neutral-light text-white hover:bg-accent/20'
                  }`}
                >
                  {modifier.modifierName}
                  {modifier.modifierPrice > 0 && (
                    <span className="ml-1">
                      +{currency} {formatPrice(modifier.modifierPrice)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItem;
