import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Add collapse animation before navigating
      const imageContainer = document.querySelector('.animate-expandImage');
      const contentContainer = document.querySelector('.animate-slideInBottom');
      
      if (imageContainer && contentContainer) {
        // Start collapse animations
        imageContainer.classList.remove('animate-expandImage');
        imageContainer.classList.add('animate-collapseImage');
        
        contentContainer.classList.remove('animate-slideInBottom');
        contentContainer.classList.add('animate-slideOutBottom');
        
        // Wait for animation to complete before navigating
        setTimeout(() => {
          navigate(-1);
        }, 300);
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
      style={{
        backgroundColor: '#1C2029',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Back Arrow Icon */}
      <svg 
        className="w-[20px] h-[20px]" 
        fill="none" 
        stroke="#ffffff" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 19l-7-7 7-7" 
        />
      </svg>
    </button>
  );
};

export default BackButton;

