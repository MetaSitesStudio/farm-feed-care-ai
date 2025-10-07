import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Nutrient } from '../types';
import { Modal } from './Modal';
import { MineralSupplementSuggestions } from './MineralSupplementSuggestions';

interface NutrientStatusProps {
  nutrients: Nutrient[];
  targets: Nutrient[];
  totalFeedWeight: number;
  feedPerAnimal: number;
}

const NutrientStatus: React.FC<NutrientStatusProps> = ({
  nutrients,
  targets,
  totalFeedWeight,
  feedPerAnimal
}) => {
  const { t } = useTranslation();
  const [showSupplements, setShowSupplements] = useState(false);

  // Use the already calculated status from targets
  const deficientNutrients = targets.filter(n => n.status === 'Low');
  const excessiveNutrients = targets.filter(n => n.status === 'High');
  const allTargetsMet = deficientNutrients.length === 0 && excessiveNutrients.length === 0;

  const getStatusColor = () => {
    if (allTargetsMet) return 'bg-green-50 border-green-200';
    if (deficientNutrients.length > 0) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusIcon = () => {
    if (allTargetsMet) return '✅';
    if (deficientNutrients.length > 0) return '⚠️';
    return '⚡';
  };

  const getStatusText = () => {
    if (allTargetsMet) return t('nutrientStatus.allTargetsMet');
    if (deficientNutrients.length > 0) {
      return `${deficientNutrients.length} ${t('nutrientStatus.deficiencies')} (${t('nutrientStatus.belowTarget')})`;
    }
    return `${excessiveNutrients.length} ${t('nutrientStatus.excesses')}`;
  };

  return (
    <>
      <div className={`p-3 rounded-lg border-2 mb-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <div>
              <p className="font-medium text-sm text-gray-800">
                {t('nutrientStatus.title')}
              </p>
              <p className="text-xs text-gray-600">{getStatusText()}</p>
            </div>
          </div>
          
          {!allTargetsMet && (
            <button
              onClick={() => setShowSupplements(true)}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              {t('nutrientStatus.suggestedSupplements')}
            </button>
          )}
        </div>

        {/* Quick status indicators */}
        {!allTargetsMet && (
          <div className="mt-2 flex flex-wrap gap-1">
            {deficientNutrients.slice(0, 3).map(nutrient => (
              <span
                key={nutrient.name}
                className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
              >
                {nutrient.name.split(' ')[0]} ↓
              </span>
            ))}
            {excessiveNutrients.slice(0, 3).map(nutrient => (
              <span
                key={nutrient.name}
                className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded"
              >
                {nutrient.name.split(' ')[0]} ↑
              </span>
            ))}
            {(deficientNutrients.length + excessiveNutrients.length) > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{(deficientNutrients.length + excessiveNutrients.length) - 3} {t('nutrientStatus.more')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Supplements Modal */}
      <Modal
        isOpen={showSupplements}
        onClose={() => setShowSupplements(false)}
        title={t('supplements.title')}
      >
        <MineralSupplementSuggestions
          currentNutrients={nutrients}
          targetNutrients={targets}
          totalFeedWeight={totalFeedWeight}
          feedPerAnimal={feedPerAnimal}
        />
      </Modal>
    </>
  );
};

export default NutrientStatus;