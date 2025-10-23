import React from 'react';

const ModifierOption = ({ 
  modifierName, 
  modifierPrice
}) => {
  return (
    <div
      className="w-full h-[40px] rounded-lg flex items-center justify-center bg-background-secondary px-3"
      style={{
        border: '1px solid #AEAEAE'
      }}
    >
      <span className="text-[12px] font-medium text-neutral-light text-center whitespace-nowrap">
        {modifierName}
        {modifierPrice > 0 && (
          <span className="ml-1">
            (+{modifierPrice})
          </span>
        )}
      </span>
    </div>
  );
};

export default ModifierOption;
