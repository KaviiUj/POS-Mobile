import React, { useEffect, useState } from 'react';

const Snackbar = ({ message, isVisible, onClose, duration = 1000 }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger slide up animation
      setShow(true);
      
      // Auto hide after duration
      const timer = setTimeout(() => {
        setShow(false);
        // Wait for animation to finish before calling onClose
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 300); // Match animation duration
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 mx-4 mb-[15px] transition-all duration-300 ease-in-out ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div 
        className={`bg-background-secondary text-[14px] font-medium py-4 px-6 text-left rounded-lg shadow-lg ${
          message.toLowerCase().includes('already') || message.toLowerCase().includes('failed') 
            ? 'text-primary' 
            : 'text-green-400'
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default Snackbar;

