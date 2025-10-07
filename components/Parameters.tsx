
import React from 'react';
import type { FeedingParameters, FeedMode } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ParametersProps {
  params: FeedingParameters;
  totalFeed: number;
  onParamChange: (field: keyof FeedingParameters, value: number | FeedMode) => void;
}

export const Parameters: React.FC<ParametersProps> = ({ params, totalFeed, onParamChange }) => {
    const { t } = useTranslation();
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 h-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">{t('parameters.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-600">{t('parameters.numberOfAnimals')}</label>
                    <input
                        type="number"
                        value={params.numberOfAnimals}
                        onChange={(e) => onParamChange('numberOfAnimals', parseInt(e.target.value) || 0)}
                        className="w-full mt-1 p-2 border rounded-lg bg-gray-700 text-white border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">{t('parameters.recommendedFeed')}</label>
                     <div className="w-full mt-1 py-2 text-gray-800 font-semibold text-lg">
                        {params.feedPerAnimal.toFixed(0)} g
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600">{t('parameters.dailyTotal')}</label>
                    <div className="w-full mt-1 py-2 text-gray-800 font-semibold text-lg">
                        {totalFeed.toFixed(3)} kg
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                 <h3 className="text-md font-semibold text-gray-700 mb-2">{t('parameters.feedingMode')}</h3>
                 <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input type="radio" name="feed-mode" value="Direct" checked={params.mode === 'Direct'} onChange={(e) => onParamChange('mode', e.target.value as FeedMode)} className="form-radio text-red-600" />
                        <span className="ml-2">{t('parameters.directFeeding')}</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="feed-mode" value="Fermentation" checked={params.mode === 'Fermentation'} onChange={(e) => onParamChange('mode', e.target.value as FeedMode)} className="form-radio text-red-600" />
                        <span className="ml-2">{t('parameters.fermentation')}</span>
                    </label>
                 </div>
                 {params.mode === 'Fermentation' && (
                     <p className="text-xs text-gray-500 mt-2">{t('parameters.fermentationNote')}</p>
                 )}
            </div>
        </div>
    );
};
