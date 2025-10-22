import React from 'react';

const Discount = ({ discount, isLarge = false, isSmall = false }) => {
  // Don't show component if discount is 0 or undefined
  if (!discount || discount === 0) {
    return null;
  }

  const getSizeClasses = () => {
    if (isLarge) {
      return {
        container: 'w-[70px] h-8',
        text: 'text-sm',
        icon: 'text-sm'
      };
    }
    if (isSmall) {
      return {
        container: 'w-[70px] h-6',
        text: 'text-xs',
        icon: 'text-xs'
      };
    }
    return {
      container: 'w-[70px] h-7',
      text: 'text-xs',
      icon: 'text-xs'
    };
  };

  const sizeClasses = getSizeClasses();

  return (
    <div 
      className={`absolute -top-1 -right-1 ${sizeClasses.container} flex items-center justify-center shadow-lg`}
      style={{
        backgroundColor: '#141921',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderTopRightRadius: '20px',
        borderTopLeftRadius: '0px',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '0px'
      }}
    >
      <span className={`${sizeClasses.text} font-semibold text-green-500`}>
        {discount}% off
      </span>
    </div>
  );
};

export default Discount;
