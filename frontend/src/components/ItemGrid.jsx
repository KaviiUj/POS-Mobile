import React, { useState, useEffect, useMemo } from 'react';
import { itemService } from '../services/itemService';
import { cartService } from '../services/cartService';
import ItemCard from './ItemCard';
import { useCartStore } from '../store/cartStore';
import { useTableStore } from '../store/tableStore';

const ItemGrid = ({ selectedCategory, categoryId, onItemAdded, onItemClick }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartId, setCart } = useCartStore();
  const { tableId, tableName } = useTableStore();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let response;
        if (selectedCategory === 'All') {
          response = await itemService.getAllItems();
        } else {
          response = await itemService.getItemsByCategory(categoryId);
        }
        
        if (response.success) {
          // Filter only active items
          const activeItems = response.data.filter(item => item.isActive);
          setItems(activeItems);
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedCategory, categoryId]);

  const handleAddToCart = async (item) => {
    try {
      console.log('Adding to cart:', item);
      console.log('Current cartId:', cartId);
      
      // Check if item has modifiers
      const hasModifiers = item.modifiers && item.modifiers.length > 0;
      
      // If item has NO modifiers, check if it already exists in cart
      if (!hasModifiers && cartId) {
        const { cart } = useCartStore.getState();
        if (cart?.items?.includes(item.itemId)) {
          console.log('❌ Item already in cart');
          if (onItemAdded) {
            onItemAdded('Item is already in the cart');
          }
          return;
        }
      }
      
      let response;
      
      if (!cartId) {
        // No cart exists, create new cart
        console.log('Creating new cart...');
        response = await cartService.addToCart(item.itemId, tableId, tableName);
      } else {
        // Cart exists, update it
        console.log('Updating existing cart...');
        response = await cartService.updateCart(cartId, item.itemId);
      }
      
      if (response.success) {
        // Save cart data
        setCart(response.data);
        console.log('✅ Cart updated:', response.data);
        
        // Show snackbar
        if (onItemAdded) {
          onItemAdded('Item added');
        }
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      // Show error snackbar
      if (onItemAdded) {
        onItemAdded('Failed to add item');
      }
    }
  };

  // Create dynamic row layouts - deterministic based on index
  const rowLayouts = useMemo(() => {
    const layouts = [];
    let currentIndex = 0;
    
    while (currentIndex < items.length) {
      const remainingItems = items.length - currentIndex;
      let rowType;
      
      if (remainingItems >= 3) {
        // Deterministic pattern based on index
        const pattern = currentIndex % 6;
        if (pattern === 0) {
          rowType = 'large'; // 1 large item
        } else if (pattern < 3) {
          rowType = 'two'; // 2 items
        } else {
          rowType = 'three'; // 3 items
        }
      } else if (remainingItems === 2) {
        rowType = 'two';
      } else {
        rowType = 'one';
      }
      
      let itemsInRow;
      switch (rowType) {
        case 'large':
          itemsInRow = items.slice(currentIndex, currentIndex + 1);
          break;
        case 'two':
          itemsInRow = items.slice(currentIndex, currentIndex + 2);
          break;
        case 'three':
          itemsInRow = items.slice(currentIndex, currentIndex + 3);
          break;
        default:
          itemsInRow = items.slice(currentIndex, currentIndex + 1);
      }
      
      layouts.push({ type: rowType, items: itemsInRow });
      currentIndex += itemsInRow.length;
    }
    
    return layouts;
  }, [items]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-neutral-light">Loading items...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-neutral-light">No items found</div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {rowLayouts.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center">
          {row.type === 'large' && (
            <div className="w-full max-w-[320px]">
              <ItemCard
                item={row.items[0]}
                onAddToCart={handleAddToCart}
                onItemClick={onItemClick}
                isLarge={true}
              />
            </div>
          )}
          
          {row.type === 'two' && (
            <div className="flex gap-4 w-full max-w-[320px]">
              {row.items.map((item) => (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  onAddToCart={handleAddToCart}
                  onItemClick={onItemClick}
                />
              ))}
            </div>
          )}
          
          {row.type === 'three' && (
            <div className="flex gap-3 w-full max-w-[500px]">
              {row.items.map((item) => (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  onAddToCart={handleAddToCart}
                  onItemClick={onItemClick}
                  isSmall={true}
                />
              ))}
            </div>
          )}
          
          {row.type === 'one' && (
            <div className="w-full max-w-[200px]">
              <ItemCard
                item={row.items[0]}
                onAddToCart={handleAddToCart}
                onItemClick={onItemClick}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;
