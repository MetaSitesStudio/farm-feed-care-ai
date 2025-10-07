import React, { useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import type { Nutrient } from '../types';

interface NutrientGap {
  nutrient: string;
  current: number;
  target: number;
  deficit: number;
  percentageShort: number;
  severity: 'low' | 'medium' | 'high';
}

interface Supplement {
  name: string;
  nutrients: { [key: string]: number }; // nutrient content per 100g
  dosagePerKg: number; // recommended grams per kg of total feed
  pricePerKg: number; // PHP per kg
  availability: 'common' | 'specialty' | 'pharmacy';
  description: string;
}

interface MineralSupplementSuggestionsProps {
  currentNutrients: Nutrient[];
  targetNutrients: Nutrient[];
  totalFeedWeight: number; // in kg
  feedPerAnimal: number; // grams per day per animal
}

// Philippine-available supplements and minerals
const PHILIPPINE_SUPPLEMENTS: Supplement[] = [
  {
    name: 'Calcium Carbonate (Limestone)',
    nutrients: { 'Calcium (g)': 38, 'Phosphorus (g)': 0 },
    dosagePerKg: 15, // 1.5% of feed
    pricePerKg: 25,
    availability: 'common',
    description: 'Cheapest calcium source, widely available in feed stores'
  },
  {
    name: 'Dicalcium Phosphate',
    nutrients: { 'Calcium (g)': 23, 'Phosphorus (g)': 18 },
    dosagePerKg: 20,
    pricePerKg: 45,
    availability: 'common',
    description: 'Balanced calcium and phosphorus, ideal for growing animals'
  },
  {
    name: 'Rock Salt (Sodium Chloride)',
    nutrients: { 'Sodium (g)': 39, 'Chloride (g)': 60 },
    dosagePerKg: 5,
    pricePerKg: 15,
    availability: 'common',
    description: 'Essential for electrolyte balance and appetite'
  },
  {
    name: 'Vitamin-Mineral Premix',
    nutrients: { 'Iron (mg)': 800, 'Zinc (mg)': 600, 'Copper (mg)': 100, 'Manganese (mg)': 400 },
    dosagePerKg: 2.5,
    pricePerKg: 280,
    availability: 'specialty',
    description: 'Complete micronutrient blend for optimal health'
  },
  {
    name: 'Oyster Shell (Calcium)',
    nutrients: { 'Calcium (g)': 35, 'Phosphorus (g)': 0 },
    dosagePerKg: 12,
    pricePerKg: 20,
    availability: 'common',
    description: 'Natural calcium source, slowly released'
  },
  {
    name: 'Bone Meal',
    nutrients: { 'Calcium (g)': 24, 'Phosphorus (g)': 12, 'Protein (g)': 15 },
    dosagePerKg: 25,
    pricePerKg: 35,
    availability: 'common',
    description: 'Natural source of calcium, phosphorus, and protein'
  }
];

export const MineralSupplementSuggestions: React.FC<MineralSupplementSuggestionsProps> = ({
  currentNutrients,
  targetNutrients,
  totalFeedWeight,
  feedPerAnimal
}) => {
  const { t } = useTranslation();

  const nutrientGaps = useMemo(() => {
    const gaps: NutrientGap[] = [];
    
    targetNutrients.forEach(target => {
      const current = currentNutrients.find(n => n.name === target.name);
      if (current && current.value < target.value) {
        const deficit = target.value - current.value;
        const percentageShort = (deficit / target.value) * 100;
        
        // Determine severity
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (percentageShort > 30) severity = 'high';
        else if (percentageShort > 15) severity = 'medium';
        
        gaps.push({
          nutrient: target.name,
          current: current.value,
          target: target.value,
          deficit,
          percentageShort,
          severity
        });
      }
    });
    
    return gaps.sort((a, b) => b.percentageShort - a.percentageShort);
  }, [currentNutrients, targetNutrients]);

  const supplementSuggestions = useMemo(() => {
    const suggestions: Array<{
      supplement: Supplement;
      targetedNutrients: string[];
      estimatedCost: number;
      dailyCostPerAnimal: number;
    }> = [];

    nutrientGaps.forEach(gap => {
      PHILIPPINE_SUPPLEMENTS.forEach(supplement => {
        const nutrientKey = gap.nutrient;
        if (supplement.nutrients[nutrientKey]) {
          const supplementAmountKg = (supplement.dosagePerKg / 1000) * totalFeedWeight;
          const costPerBatch = supplementAmountKg * supplement.pricePerKg;
          const dailyCostPerAnimal = (costPerBatch * feedPerAnimal / 1000) / totalFeedWeight;
          
          const existing = suggestions.find(s => s.supplement.name === supplement.name);
          if (existing) {
            if (!existing.targetedNutrients.includes(nutrientKey)) {
              existing.targetedNutrients.push(nutrientKey);
            }
          } else {
            suggestions.push({
              supplement,
              targetedNutrients: [nutrientKey],
              estimatedCost: costPerBatch,
              dailyCostPerAnimal
            });
          }
        }
      });
    });

    return suggestions.sort((a, b) => a.dailyCostPerAnimal - b.dailyCostPerAnimal);
  }, [nutrientGaps, totalFeedWeight, feedPerAnimal]);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-300';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'common': return '🏪';
      case 'specialty': return '🏢';
      case 'pharmacy': return '💊';
      default: return '📦';
    }
  };

  if (nutrientGaps.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">✅</span>
          <div>
            <h3 className="font-semibold text-green-800">{t('supplements.allGood')}</h3>
            <p className="text-green-600 text-sm">{t('supplements.allGoodDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">⚖️</span>
          {t('supplements.title')}
        </h3>
        
        {/* Nutrient Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {nutrientGaps.map((gap, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(gap.severity)}`}>
              <div className="font-semibold text-sm">{gap.nutrient}</div>
              <div className="text-xs">
                {gap.current.toFixed(1)} / {gap.target.toFixed(1)}
                <span className="ml-2 font-medium">
                  (-{gap.percentageShort.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Supplement Recommendations */}
        <h4 className="font-semibold text-gray-700 mb-3">{t('supplements.recommendations')}</h4>
        <div className="space-y-4">
          {supplementSuggestions.slice(0, 3).map((suggestion, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="mr-2">{getAvailabilityIcon(suggestion.supplement.availability)}</span>
                    <h5 className="font-semibold text-gray-800">{suggestion.supplement.name}</h5>
                    <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {suggestion.supplement.availability}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{suggestion.supplement.description}</p>
                  
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">{t('supplements.targets')}:</span> {suggestion.targetedNutrients.join(', ')}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">{t('supplements.dosage')}:</span> {suggestion.supplement.dosagePerKg}g per kg of feed
                  </div>
                </div>
                
                <div className="text-right sm:text-left">
                  <div className="font-semibold text-green-600">
                    ₱{suggestion.estimatedCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ₱{suggestion.dailyCostPerAnimal.toFixed(3)}/animal/day
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {supplementSuggestions.length > 3 && (
          <div className="text-center mt-4">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              {t('supplements.seeMore')} ({supplementSuggestions.length - 3} {t('supplements.more')})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};