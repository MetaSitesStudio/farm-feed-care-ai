
import React, { useState, useEffect, useCallback } from 'react';
import { getVaccinationSchedule, getAlternativeTherapies } from '../services/geminiService';
import type { VaccinationScheduleResponse, AlternativeTherapiesResponse } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface AdditionalInfoProps {
  animal: string;
  subSpecies: string;
}

type Tab = 'vaccination' | 'therapies';

/**
 * Safely extracts a string from a potentially nested or complex data structure.
 * This prevents the "[object Object]" error in the UI.
 * @param value The value from the AI response, which could be a string, object, or array.
 * @returns A string for display.
 */
const safeGetString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(safeGetString).join(', ');
    if (typeof value === 'object' && value !== null) {
        const commonKeys = ['text', 'description', 'purpose', 'benefit', 'name', 'details', 'age', 'vaccine', 'administration'];
        for (const key of commonKeys) {
            if (typeof value[key] === 'string') return value[key];
        }
        for (const key in value) {
            if (typeof value[key] === 'string') return value[key];
        }
        return JSON.stringify(value);
    }
    return String(value ?? 'N/A');
};


export const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ animal, subSpecies }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('vaccination');
  const [vaccinationData, setVaccinationData] = useState<VaccinationScheduleResponse | null>(null);
  const [therapiesData, setTherapiesData] = useState<AlternativeTherapiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setVaccinationData(null);
    setTherapiesData(null);

    try {
      if (activeTab === 'vaccination') {
        const data = await getVaccinationSchedule(animal, subSpecies);
        setVaccinationData(data);
      } else if (activeTab === 'therapies') {
        const data = await getAlternativeTherapies(animal, subSpecies);
        setTherapiesData(data);
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`${t('additionalInfo.error.prefix')} ${activeTab}. ${errorMessage}`);
        console.error("Error fetching additional info:", err);
    } finally {
        setIsLoading(false);
    }
  }, [activeTab, animal, subSpecies, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabClass = (tabName: Tab) => 
    `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
      activeTab === tabName 
        ? 'border-b-2 border-red-600 text-red-600' 
        : 'text-gray-500 hover:text-red-500'
    }`;
  
  const renderContent = () => {
    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-full">
            <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">{t('additionalInfo.loading')}</p>
          </div>
      );
    }

    if (error) {
        return <p className="text-red-500 font-semibold p-4 bg-red-100 border border-red-300 rounded-lg">{error}</p>;
    }
    
    if (activeTab === 'vaccination' && vaccinationData) {
      return (
        <div className="space-y-6">
          <p className="text-gray-700 italic">{safeGetString(vaccinationData.introduction)}</p>
          <div className="space-y-4">
            {vaccinationData.schedule?.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-red-700 bg-red-100 inline-block px-2 py-1 rounded-md mb-3">{safeGetString(item.age)}</p>
                <h4 className="text-lg font-bold text-gray-800">{safeGetString(item.vaccine)}</h4>
                <p className="text-gray-600 mt-1">{safeGetString(item.purpose)}</p>
              </div>
            ))}
          </div>
          {vaccinationData.notes && (
             <div className="mt-6 p-4 bg-gray-100 border-l-4 border-gray-400">
                <p className="font-semibold text-gray-800">{t('additionalInfo.notes')}:</p>
                <p className="text-gray-700">{safeGetString(vaccinationData.notes)}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (activeTab === 'therapies' && therapiesData) {
      return (
         <div className="space-y-6">
          <p className="text-gray-700 italic">{safeGetString(therapiesData.introduction)}</p>
          <div className="space-y-4">
            {therapiesData.therapies?.map((therapy, index) => (
               <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-bold text-gray-800">{safeGetString(therapy.name)}</h4>
                <p className="text-gray-600 mt-2"><span className="font-semibold text-gray-700">{t('additionalInfo.therapies.benefit')}:</span> {safeGetString(therapy.benefit)}</p>
                <p className="text-gray-600 mt-1"><span className="font-semibold text-gray-700">{t('additionalInfo.therapies.administration')}:</span> {safeGetString(therapy.administration)}</p>
              </div>
            ))}
          </div>
           {therapiesData.disclaimer && (
             <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
                <p className="font-semibold">{t('additionalInfo.disclaimer')}:</p>
                <p>{safeGetString(therapiesData.disclaimer)}</p>
            </div>
          )}
        </div>
      );
    }

    return <p className="text-gray-500 text-center py-8">{t('additionalInfo.noData')}</p>;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t('additionalInfo.title')}</h2>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button onClick={() => setActiveTab('vaccination')} className={tabClass('vaccination')}>
            {t('additionalInfo.tabs.vaccination')}
          </button>
          <button onClick={() => setActiveTab('therapies')} className={tabClass('therapies')}>
            {t('additionalInfo.tabs.therapies')}
          </button>
        </nav>
      </div>
      <div className="mt-4 p-4 bg-gray-50 rounded-b-lg min-h-[200px]">
        {renderContent()}
      </div>
    </div>
  );
};
