import React, { useState } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategorySelector from '../components/CategorySelector';
import ItemGrid from '../components/ItemGrid';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
    // TODO: Implement search functionality
  };

  const handleCategoryChange = (categoryName, categoryId = null) => {
    console.log('Category selected:', categoryName, categoryId);
    setSelectedCategory(categoryName);
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-50 bg-background-primary px-[30px] py-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header with Logo and Restaurant Name */}
          <Header />
          
          {/* Search Component */}
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Find Your Coffee..."
          />
          
          {/* Category Selector */}
          <div className="mt-8">
            <CategorySelector onCategoryChange={handleCategoryChange} />
          </div>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="px-[30px] pb-8 -mt-2">
        <div className="max-w-2xl mx-auto w-full">
          {/* Item Grid */}
          <ItemGrid 
            selectedCategory={selectedCategory}
            categoryId={selectedCategoryId}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;

