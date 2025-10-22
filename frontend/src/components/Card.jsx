import React from 'react';

const Card = ({ children, className = '', useItemSurface = false, ...props }) => {
  return (
    <div
      className={`rounded-3xl p-6 shadow-lg ${className}`}
      style={{
        background: useItemSurface 
          ? 'url(/src/assets/item-surface.png), linear-gradient(to bottom, #262B33, #262B3300)'
          : 'linear-gradient(to bottom, #262B33, #262B3300)',
        backgroundSize: useItemSurface ? 'cover' : 'auto',
        backgroundPosition: useItemSurface ? 'center' : 'auto',
        backgroundRepeat: useItemSurface ? 'no-repeat' : 'repeat'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

