
import React from 'react';
import type { Nutrient } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface TargetsComparisonProps {
  targets: Nutrient[];
}

export const TargetsComparison: React.FC<TargetsComparisonProps> = ({ targets }) => {
  const { t } = useTranslation();
    
  const getStatusColor = (status?: string) => {
    switch(status) {
        case 'Met': return 'bg-green-100 text-green-800';
        case 'Low': return 'bg-yellow-100 text-yellow-800';
        case 'High': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getTranslatedStatus = (status?: 'Low' | 'Met' | 'High' | 'N/A') => {
    if (!status) return 'N/A';
    const key = `status.${status.toLowerCase()}`;
    return t(key);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t('targetsComparison.title')}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('targetsComparison.table.nutrient')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('targetsComparison.table.actual')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('targetsComparison.table.goalRange')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('targetsComparison.table.unit')}</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('targetsComparison.table.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {targets.map((target) => (
              <tr key={target.name} className="hover:bg-gray-50">
                <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-800">{target.name}</td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{target.value?.toFixed(2)}</td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">
                    {`${target.goalMin?.toFixed(2) ?? 'N/A'} - ${target.goalMax?.toFixed(2) ?? 'N/A'}`}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{target.unit}</td>
                <td className="py-3 px-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(target.status)}`}>
                    {getTranslatedStatus(target.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
