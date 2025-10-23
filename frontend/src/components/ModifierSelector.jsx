import React from 'react';
import ModifierOption from './ModifierOption';

const ModifierSelector = ({ modifiers = [] }) => {
  if (!modifiers || modifiers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-neutral-light text-[14px] font-semibold">
        Modifiers
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {modifiers.map((modifier, index) => (
          <div key={index} className="flex-shrink-0 w-[120px]">
            <ModifierOption
              modifierName={modifier.modifierName}
              modifierPrice={modifier.modifierPrice}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifierSelector;
