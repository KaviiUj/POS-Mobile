import React, { useState, useEffect } from 'react';
import { itemService } from '../services/itemService';
import ItemCard from './ItemCard';

const ItemGrid = ({ selectedCategory, categoryId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddToCart = (item) => {
    console.log('Adding to cart:', item);
    // TODO: Implement add to cart functionality
  };

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

  // Create dynamic row layouts
  const createRowLayouts = (items) => {
    const layouts = [];
    let currentIndex = 0;
    
    while (currentIndex < items.length) {
      const remainingItems = items.length - currentIndex;
      let rowType;
      
      if (remainingItems >= 3) {
        // Randomly choose between 1 large, 2 items, or 3 items
        const random = Math.random();
        if (random < 0.2) {
          rowType = 'large'; // 1 large item
        } else if (random < 0.6) {
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
  };

  const rowLayouts = createRowLayouts(items);

  return (
    <div className="mt-6 space-y-6">
      {rowLayouts.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center">
          {row.type === 'large' && (
            <div className="w-full max-w-[320px]">
              <ItemCard
                item={row.items[0]}
                onAddToCart={handleAddToCart}
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
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;

