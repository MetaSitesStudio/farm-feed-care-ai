
import React, { useState } from 'react';
import type { FeedIngredient, IndustrialFeedWithWeight, Nutrient, NutritionalTarget } from '../types';
import { getFeedSuggestion } from '../services/geminiService';
import { IngredientSlider } from './IngredientSlider';
import { PHILIPPINE_FEEDS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

interface MixWeightsProps {
  ingredients: FeedIngredient[];
  onIngredientChange: (index: number, newWeight: number) => void;
  onPriceChange: (index: number, newPrice: number) => void;
  onLockToggle: (index: number) => void;
  totalFeed: number;
  onReset: () => void;
  animal: string;
  subSpecies: string;
  setIngredients: React.Dispatch<React.SetStateAction<FeedIngredient[]>>;
  setIndustrialFeed: React.Dispatch<React.SetStateAction<IndustrialFeedWithWeight | null>>;
  industrialFeed: IndustrialFeedWithWeight | null;
  baseTargets: NutritionalTarget[];
  addIngredient: (name: string) => void;
  removeIngredient: (index: number) => void;
}

export const MixWeights: React.FC<MixWeightsProps> = ({
  ingredients,
  onIngredientChange,
  onPriceChange,
  onLockToggle,
  totalFeed,
  onReset,
  animal,
  subSpecies,
  setIngredients,
  setIndustrialFeed,
  industrialFeed,
  baseTargets,
  addIngredient,
  removeIngredient,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIngredient, setSelectedIngredient] = useState('');

    const getIngredientTranslationKey = (name: string) => `ingredients.${name.toLowerCase().replace(/[ /()]/g, '')}`;

    const handleAddIngredient = () => {
        if (selectedIngredient) {
            addIngredient(selectedIngredient);
            setSelectedIngredient('');
        }
    };
    
    const availableToAdd = PHILIPPINE_FEEDS.filter(
        baseIng => !ingredients.some(i => i.name === baseIng.name)
    );

    const handleSuggestMix = async () => {
        if (!industrialFeed) return;
        setIsLoading(true);
        setError(null);
        try {
            const suggestedMix = await getFeedSuggestion(animal, subSpecies, totalFeed, ingredients, industrialFeed, baseTargets);
            
            if (suggestedMix) {
                // Update natural ingredients based on what's currently in the user's list
                const newNaturalIngredients = ingredients.map(currentIng => {
                    const suggestion = suggestedMix.find(s => s.name === currentIng.name);
                    return {
                        ...currentIng,
                        weight: suggestion ? suggestion.weight : 0,
                    };
                });
                setIngredients(newNaturalIngredients);

                // Update industrial feed
                const industrialSuggestion = suggestedMix.find(s => s.name === industrialFeed.name);
                if (industrialSuggestion) {
                    setIndustrialFeed(prev => prev ? {...prev, weight: industrialSuggestion.weight} : null);
                } else {
                    const totalNaturalWeight = newNaturalIngredients.reduce((sum, ing) => sum + ing.weight, 0);
                    const newIndustrialWeight = Math.max(0, totalFeed - totalNaturalWeight);
                    setIndustrialFeed(prev => prev ? {...prev, weight: newIndustrialWeight} : null);
                }
            }

        } catch (err) {
            console.error("Failed to get suggestion:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`${t('mixWeights.error.prefix')} ${errorMessage} ${t('mixWeights.error.suffix')}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const totalNaturalWeight = ingredients.reduce((sum, ing) => sum + ing.weight, 0);
    const totalWeight = totalNaturalWeight + (industrialFeed?.weight || 0);

    const totalNaturalCost = ingredients.reduce((sum, ing) => sum + (ing.weight * (ing.pricePerKg || 0)), 0);
    const totalCommercialCost = (industrialFeed?.weight || 0) * (industrialFeed?.pricePerKg || 0);
    const totalMixCost = totalNaturalCost + totalCommercialCost;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between mb-2 gap-4">
                <h2 className="text-xl font-bold text-gray-800">{t('mixWeights.title')}</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onReset}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition shadow-sm"
                    >
                        {t('mixWeights.resetButton')}
                    </button>
                    <button
                        onClick={handleSuggestMix}
                        disabled={isLoading || !industrialFeed || ingredients.length === 0}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-sm disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('mixWeights.optimizingButton')}
                            </div>
                        ) : t('mixWeights.optimizeButton')}
                    </button>
                </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 -mt-2">
                {t('mixWeights.subtitle')}
            </p>

            {error && (
                <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="my-4 p-4 bg-gray-50 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('mixWeights.addIngredientLabel')}</label>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedIngredient}
                        onChange={e => setSelectedIngredient(e.target.value)}
                        className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition bg-white border-gray-300"
                    >
                        <option value="">{t('mixWeights.selectPlaceholder')}</option>
                        {availableToAdd.map(ing => (
                            <option key={ing.name} value={ing.name}>{t(getIngredientTranslationKey(ing.name))}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddIngredient}
                        disabled={!selectedIngredient}
                        className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm disabled:bg-gray-400"
                    >
                        {t('mixWeights.addButton')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {ingredients.length > 0 ? (
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>{t('mixWeights.table.ingredient')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{width: '40%'}}>{t('mixWeights.table.weightSlider')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('mixWeights.table.weightKg')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('mixWeights.table.pricePerKg')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('mixWeights.table.locked')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {ingredients.map((ing, index) => {
                                return (
                                    <tr key={ing.name} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-800">{t(getIngredientTranslationKey(ing.name))}</td>
                                        <td className="py-3 px-4">
                                            <IngredientSlider 
                                                value={ing.weight} 
                                                onChange={(val) => onIngredientChange(index, val)}
                                                max={totalFeed}
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={ing.weight.toFixed(2)}
                                                onChange={(e) => onIngredientChange(index, parseFloat(e.target.value) || 0)}
                                                className="w-24 p-1 border rounded-md bg-gray-700 text-white border-gray-600"
                                                aria-label={`Weight for ${ing.name}`}
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                             <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={ing.pricePerKg || ''}
                                                placeholder="0.00"
                                                onChange={(e) => onPriceChange(index, parseFloat(e.target.value) || 0)}
                                                className="w-24 p-1 border rounded-md bg-gray-700 text-white border-gray-600"
                                                aria-label={`Price for ${ing.name}`}
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={ing.locked}
                                                onChange={() => onLockToggle(index)}
                                                className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => removeIngredient(index)} className="text-gray-400 hover:text-red-600 transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-semibold text-sm">
                            <tr className="border-t-2 border-gray-300">
                                <td colSpan={2} className="py-2 px-4 text-right">{t('mixWeights.table.naturalMixCost')}</td>
                                <td colSpan={2} className="py-2 px-4 text-left">{totalNaturalCost.toFixed(2)} PHP</td>
                                <td colSpan={2}></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="py-2 px-4 text-right">{t('mixWeights.table.commercialCost')}</td>
                                <td colSpan={2} className="py-2 px-4 text-left">{totalCommercialCost.toFixed(2)} PHP</td>
                                <td colSpan={2}></td>
                            </tr>
                            <tr className="bg-gray-200 text-base">
                                <td colSpan={2} className="py-3 px-4 text-right">{t('mixWeights.table.totalMixCost')}</td>
                                <td colSpan={2} className="py-3 px-4 text-left">{totalMixCost.toFixed(2)} PHP</td>
                                <td colSpan={2}></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="py-3 px-4 text-right">{t('mixWeights.table.totalMixWeight')}</td>
                                <td colSpan={2} className="py-3 px-4 text-left">{totalWeight.toFixed(3)} kg / {totalFeed.toFixed(3)} kg</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <p>{t('mixWeights.noIngredients.line1')}</p>
                        <p className="text-sm">{t('mixWeights.noIngredients.line2')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
