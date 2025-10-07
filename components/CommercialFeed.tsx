
import React from 'react';
import { INDUSTRIAL_FEEDS } from '../constants';
import type { IndustrialFeedWithWeight } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface CommercialFeedProps {
    selectedFeed: IndustrialFeedWithWeight;
    onFeedChange: (feedName: string) => void;
    onPriceChange: (price: number) => void;
    animal: string;
    totalFeed: number;
    naturalIngredientsCost: number;
}

export const CommercialFeed: React.FC<CommercialFeedProps> = ({ selectedFeed, onFeedChange, onPriceChange, animal, totalFeed, naturalIngredientsCost }) => {
    const { t } = useTranslation();
    const suitableFeeds = INDUSTRIAL_FEEDS.filter(f => f.animal.includes(animal));

    const potentialCost = totalFeed * selectedFeed.pricePerKg;
    const commercialCost = selectedFeed.weight * selectedFeed.pricePerKg;
    const totalCurrentCost = commercialCost + naturalIngredientsCost;
    const savings = potentialCost - totalCurrentCost;

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">{t('commercialFeed.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-6">
                <div>
                    <label htmlFor="feed-type-select" className="block text-sm font-medium text-gray-600 mb-1">
                        {t('commercialFeed.feedType')}
                    </label>
                    <select
                        id="feed-type-select"
                        value={selectedFeed.name}
                        onChange={(e) => onFeedChange(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition bg-gray-700 text-white border-gray-600"
                    >
                        {suitableFeeds.map((feed) => (
                            <option key={feed.name} value={feed.name}>
                                {feed.name}
                            </option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="feed-price-input" className="block text-sm font-medium text-gray-600 mb-1">
                        {t('commercialFeed.pricePerKg')}
                    </label>
                    <input
                        id="feed-price-input"
                        type="number"
                        value={selectedFeed.pricePerKg}
                        onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded-lg bg-gray-700 text-white border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('commercialFeed.calculatedAmount')}</label>
                    <div className="w-full mt-1 p-2 bg-gray-100 rounded-lg text-gray-800 font-semibold text-lg">
                        {selectedFeed.weight.toFixed(3)} kg
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{t('commercialFeed.totalPotentialCost')}</p>
                    <p className="text-2xl font-bold text-gray-800">{potentialCost.toFixed(2)} PHP</p>
                    <p className="text-xs text-gray-500">{t('commercialFeed.potentialCostNote')}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                     <p className="text-sm text-red-700">{t('commercialFeed.currentTotalCost')}</p>
                    <p className="text-2xl font-bold text-red-800">{totalCurrentCost.toFixed(2)} PHP</p>
                     <p className="text-xs text-red-600">{t('commercialFeed.currentCostNote')}</p>
                </div>
                 <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                     <p className="text-sm text-green-700">{t('commercialFeed.dailySavings')}</p>
                    <p className="text-2xl font-bold text-green-800">{savings.toFixed(2)} PHP</p>
                     <p className="text-xs text-green-600">{t('commercialFeed.savingsNote')}</p>
                </div>
            </div>
        </div>
    );
};
