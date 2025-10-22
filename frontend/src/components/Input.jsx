import React from 'react';

const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name,
  className = '',
  ...props 
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 bg-background-primary text-white rounded-xl 
        placeholder-neutral-light focus:outline-none focus:ring-2 
        focus:ring-accent transition-all ${className}`}
      {...props}
    />
  );
};

export default Input;

