
import React from 'react';
import type { Nutrient } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface NutrientBlendsProps {
  nutrients: Nutrient[];
  totalFeed: number;
  feedPerAnimal: number;
}

export const NutrientBlends: React.FC<NutrientBlendsProps> = ({ nutrients, totalFeed, feedPerAnimal }) => {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t('nutrientBlends.title')}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('nutrientBlends.table.nutrient')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('nutrientBlends.table.per100g')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('nutrientBlends.table.per1kg')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('nutrientBlends.table.perAnimal')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('nutrientBlends.table.totalDay')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {nutrients.map((nutrient) => {
                const per100g = nutrient.value;
                const per1kg = per100g * 10;
                const perBird = per100g * (feedPerAnimal / 100);
                const totalDay = per1kg * totalFeed;

                return(
                    <tr key={nutrient.name} className="hover:bg-gray-50">
                        <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-800">{nutrient.name}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{per100g.toFixed(2)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{per1kg.toFixed(2)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{perBird.toFixed(2)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{totalDay.toFixed(2)}</td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
