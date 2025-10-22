import React, { useState } from 'react';

const SearchBar = ({ onSearch, placeholder = "Find Your Coffee..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg 
            className="w-5 h-5 text-neutral-light" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full px-12 py-4 bg-background-search text-white rounded-[15px]
            placeholder-text-placeholder focus:outline-none focus:ring-2 
            focus:ring-accent transition-all text-[10px] font-medium"
        />
      </div>
    </form>
  );
};

export default SearchBar;

