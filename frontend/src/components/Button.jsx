import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  ...props 
}) => {
  const variants = {
    primary: 'bg-accent text-white hover:bg-opacity-90',
    secondary: 'bg-background-secondary text-white hover:bg-opacity-80',
    danger: 'bg-primary text-white hover:bg-opacity-90',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-3 rounded-[20px] font-medium 
        transition-all duration-200 disabled:opacity-50 
        disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

