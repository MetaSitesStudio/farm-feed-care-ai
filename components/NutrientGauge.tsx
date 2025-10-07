import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Nutrient } from '../types';

interface NutrientGaugeProps {
  nutrients: Nutrient[];
  targets: Nutrient[];
  totalFeedWeight: number;
  feedPerAnimal: number;
  onAutoAdjust?: () => void;
}

const NutrientGauge: React.FC<NutrientGaugeProps> = ({
  nutrients,
  targets,
  onAutoAdjust
}) => {
  const { t } = useTranslation();

  // Simple percentage calculation relative to perfect nutrition
  const nutritionStatus = targets.map(target => {
    if (!target.goalMin || !target.goalMax || !target.value) {
      return { ...target, percentage: 0, status: 'N/A' as const };
    }

    const actualValue = target.value; // Use the already calculated per-animal value from targets
    const perfectValue = (target.goalMin + target.goalMax) / 2; // Middle of range = 100%
    
    // Simple percentage: actual / perfect * 100
    const percentage = Math.round((actualValue / perfectValue) * 100);
    
    return {
      ...target,
      percentage: Math.max(0, Math.min(200, percentage)), // Cap at 200% max
      status: target.status
    };
  });

  const deficientCount = nutritionStatus.filter(n => n.status === 'Low').length;
  const excessiveCount = nutritionStatus.filter(n => n.status === 'High').length;

  const getGaugeColor = (percentage: number) => {
    if (percentage < 70) return '#ef4444'; // Red - too low
    if (percentage < 90) return '#f59e0b'; // Yellow - low
    if (percentage >= 95 && percentage <= 105) return '#10b981'; // Green - perfect
    if (percentage < 120) return '#f59e0b'; // Yellow - high
    return '#ef4444'; // Red - too high
  };



  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {/* Simple Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{t('gauge.nutritionLevel')}</h3>
        
        {(deficientCount > 0 || excessiveCount > 0) && (
          <button
            onClick={() => onAutoAdjust?.()}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            {t('gauge.optimize')}
          </button>
        )}
      </div>

      {/* Simple Percentage Gauges */}
      <div className="grid grid-cols-5 gap-4">
        {nutritionStatus.map((nutrient, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {nutrient.name.split(' ')[0]}
            </div>
            
            {/* Simple Circular Progress */}
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                
                {/* Progress circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={getGaugeColor(nutrient.percentage)}
                  strokeWidth="3"
                  strokeDasharray={`${Math.min(100, nutrient.percentage)}, 100`}
                />
              </svg>
              
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: getGaugeColor(nutrient.percentage) }}>
                  {nutrient.percentage}%
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {nutrient.percentage >= 95 && nutrient.percentage <= 105 ? 
                t('gauge.optimal') : 
                nutrient.percentage < 95 ? 
                  t('gauge.low') : 
                  t('gauge.high')
              }
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

export default NutrientGauge;