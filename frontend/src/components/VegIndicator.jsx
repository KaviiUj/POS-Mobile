import React from 'react';

const VegIndicator = ({ isVeg = true }) => {
  const color = isVeg ? '#10B981' : '#DC3535'; // Green for veg, red for non-veg

  return (
    <div 
      className="w-[25px] h-[25px] bg-white rounded-[10px] flex items-center justify-center"
      style={{
        border: `1px solid ${color}`
      }}
    >
      {/* Circle inside */}
      <div 
        className="w-[10px] h-[10px] rounded-full"
        style={{
          backgroundColor: color
        }}
      />
    </div>
  );
};

export default VegIndicator;

