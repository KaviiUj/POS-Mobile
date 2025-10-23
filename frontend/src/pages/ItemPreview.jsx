import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import ItemInfo from '../components/ItemInfo';
import ModifierSelector from '../components/ModifierSelector';
import ItemFooter from '../components/ItemFooter';
import Snackbar from '../components/Snackbar';
import { cartService } from '../services/cartService';
import { useCartStore } from '../store/cartStore';
import { useTableStore } from '../store/tableStore';

const ItemPreview = ({ item, onClose }) => {
  const { cartId, setCart } = useCartStore();
  const { tableId, tableName } = useTableStore();
  const [snackbar, setSnackbar] = useState({ message: '', isVisible: false });

  if (!item) {
    return null;
  }

  const handleAddToCart = async () => {
    try {
      console.log('Adding to cart:', item);
      console.log('Current cartId:', cartId);
      
      const hasModifiers = item.modifiers && item.modifiers.length > 0;
      
      if (!hasModifiers && cartId) {
        const { cart } = useCartStore.getState();
        if (cart?.items?.includes(item.itemId)) {
          console.log('❌ Item already in cart');
          setSnackbar({ message: 'Item is already in the cart', isVisible: true });
          return;
        }
      }
      
      let response;
      
      if (!cartId) {
        console.log('Creating new cart...');
        response = await cartService.addToCart(item.itemId, tableId, tableName);
      } else {
        console.log('Updating existing cart...');
        response = await cartService.updateCart(cartId, item.itemId);
      }
      
      if (response.success) {
        setCart(response.data);
        console.log('✅ Cart updated:', response.data);
        setSnackbar({ message: 'Item added to cart', isVisible: true });
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      setSnackbar({ message: 'Failed to add item to cart', isVisible: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] min-h-screen bg-background-primary pb-24 overflow-y-auto">
      {/* Item Image - 60% from top */}
      <div className="h-[60vh] w-full relative animate-expandImage">
        <img
          src={item.itemImage}
          alt={item.itemName}
          className="w-full h-full object-cover"
        />
        
        {/* Back Button on Image */}
        <div className="absolute top-[60px] left-[24px] z-10">
          <BackButton onClick={onClose} />
        </div>
        
        {/* Item Info at Bottom of Image */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <ItemInfo 
            itemName={item.itemName}
            cuisine={item.cuisine}
            discount={item.discount}
            isVeg={item.isVeg}
          />
        </div>
      </div>
      
      {/* Content Section - Slides in from bottom */}
      <div className="animate-slideInBottom">
        {/* Description Section - Below Image */}
        {item.itemDescription && (
          <div className="px-6 py-4 bg-background-primary">
            <h3 className="text-neutral-light text-[14px] font-semibold mb-2">
              Description
            </h3>
            <p className="text-white text-[12px] font-normal leading-relaxed">
              {item.itemDescription}
            </p>
          </div>
        )}
        
        {/* Modifiers Section */}
        {item.modifiers && item.modifiers.length > 0 && (
          <div className="px-6 pb-4 bg-background-primary">
            <ModifierSelector 
              modifiers={item.modifiers}
            />
          </div>
        )}
      </div>
      
      {/* Fixed Footer - Always at bottom */}
      <ItemFooter 
        item={item}
        onAddToCart={handleAddToCart}
      />
      
      {/* Snackbar */}
      <Snackbar
        message={snackbar.message}
        isVisible={snackbar.isVisible}
        onClose={() => setSnackbar({ message: '', isVisible: false })}
      />
    </div>
  );
};

export default ItemPreview;

