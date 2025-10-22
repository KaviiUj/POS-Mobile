import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';

const CategorySelector = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        if (response.success) {
          // Filter only active categories
          const activeCategories = response.data.filter(category => category.isActive);
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategorySelect = (categoryName, categoryId = null) => {
    setSelectedCategory(categoryName);
    if (onCategoryChange) {
      onCategoryChange(categoryName, categoryId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="text-neutral-light text-sm">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="flex space-x-6 overflow-x-auto pb-2">
      {/* All Category */}
      <button
        onClick={() => handleCategorySelect('All')}
        className="flex flex-col items-center whitespace-nowrap"
      >
        <span
          className={`text-[14px] font-semibold transition-colors ${
            selectedCategory === 'All'
              ? 'text-accent'
              : 'text-neutral-medium'
          }`}
        >
          All
        </span>
        {selectedCategory === 'All' && (
          <div className="w-2 h-2 bg-accent rounded-full mt-1"></div>
        )}
      </button>

      {/* Dynamic Categories */}
      {categories.map((category) => (
        <button
          key={category.categoryId}
          onClick={() => handleCategorySelect(category.categoryName, category.categoryId)}
          className="flex flex-col items-center whitespace-nowrap"
        >
          <span
            className={`text-[14px] font-semibold transition-colors ${
              selectedCategory === category.categoryName
                ? 'text-accent'
                : 'text-neutral-medium'
            }`}
          >
            {category.categoryName}
          </span>
          {selectedCategory === category.categoryName && (
            <div className="w-2 h-2 bg-accent rounded-full mt-1"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;

