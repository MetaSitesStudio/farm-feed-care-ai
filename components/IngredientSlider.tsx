
import React from 'react';

interface IngredientSliderProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
}

export const IngredientSlider: React.FC<IngredientSliderProps> = ({ value, onChange, max }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <div className="flex items-center">
      <input
        type="range"
        min="0"
        max={max}
        step={max / 500} // Finer steps for larger ranges
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
      />
    </div>
  );
};
