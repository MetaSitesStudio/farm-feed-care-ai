
import React, { useState } from 'react';
import { getVaccinationSchedule, getAlternativeTherapies } from '../services/geminiService';
import type { VaccinationScheduleResponse, AlternativeTherapiesResponse } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Modal } from './Modal';

interface AdditionalInfoProps {
  animal: string;
  subSpecies: string;
}

type ModalType = 'vaccination' | 'therapies' | null;

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
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [vaccinationData, setVaccinationData] = useState<VaccinationScheduleResponse | null>(null);
  const [therapiesData, setTherapiesData] = useState<AlternativeTherapiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleVaccinationClick = async () => {
    setOpenModal('vaccination');
    if (!vaccinationData) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getVaccinationSchedule(animal, subSpecies);
        setVaccinationData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`${t('additionalInfo.error.prefix')} vaccination. ${errorMessage}`);
        console.error("Error fetching vaccination schedule:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTherapiesClick = async () => {
    setOpenModal('therapies');
    if (!therapiesData) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAlternativeTherapies(animal, subSpecies);
        setTherapiesData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`${t('additionalInfo.error.prefix')} therapies. ${errorMessage}`);
        console.error("Error fetching alternative therapies:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeModal = () => {
    setOpenModal(null);
    setError(null);
  };

  const renderVaccinationContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-3 text-gray-600">{t('additionalInfo.loading')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      );
    }

    if (vaccinationData) {
      return (
        <div className="space-y-6">
          <p className="text-gray-700 italic text-lg">{safeGetString(vaccinationData.introduction)}</p>
          <div className="space-y-4">
            {vaccinationData.schedule?.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-blue-700 bg-blue-100 inline-block px-3 py-1 rounded-full mb-3">{safeGetString(item.age)}</p>
                <h4 className="text-xl font-bold text-gray-800 mb-2">{safeGetString(item.vaccine)}</h4>
                <p className="text-gray-600 leading-relaxed">{safeGetString(item.purpose)}</p>
              </div>
            ))}
          </div>
          {vaccinationData.notes && (
            <div className="mt-6 p-4 bg-gray-100 border-l-4 border-gray-400 rounded-r-lg">
              <p className="font-semibold text-gray-800">{t('additionalInfo.notes')}:</p>
              <p className="text-gray-700 mt-2">{safeGetString(vaccinationData.notes)}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderTherapiesContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-3 text-gray-600">{t('additionalInfo.loading')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      );
    }

    if (therapiesData) {
      return (
        <div className="space-y-6">
          <p className="text-gray-700 italic text-lg">{safeGetString(therapiesData.introduction)}</p>
          <div className="space-y-4">
            {therapiesData.therapies?.map((therapy, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-gray-800 mb-3">{safeGetString(therapy.name)}</h4>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-semibold text-green-700">{t('additionalInfo.therapies.benefit')}:</span> {safeGetString(therapy.benefit)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold text-green-700">{t('additionalInfo.therapies.administration')}:</span> {safeGetString(therapy.administration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {therapiesData.disclaimer && (
            <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg">
              <p className="font-semibold">{t('additionalInfo.disclaimer')}:</p>
              <p className="mt-2">{safeGetString(therapiesData.disclaimer)}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">{t('additionalInfo.title')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vaccination Schedule Button */}
        <button
          onClick={handleVaccinationClick}
          className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <div className="flex items-center justify-center mb-3">
            <span className="text-3xl mr-3">💉</span>
            <h3 className="text-lg font-bold">{t('additionalInfo.buttons.vaccination')}</h3>
          </div>
          <p className="text-blue-100 text-sm">{t('additionalInfo.buttons.vaccinationDesc')}</p>
        </button>

        {/* Alternative Therapies Button */}
        <button
          onClick={handleTherapiesClick}
          className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          <div className="flex items-center justify-center mb-3">
            <span className="text-3xl mr-3">🌿</span>
            <h3 className="text-lg font-bold">{t('additionalInfo.buttons.therapies')}</h3>
          </div>
          <p className="text-green-100 text-sm">{t('additionalInfo.buttons.therapiesDesc')}</p>
        </button>
      </div>

      {/* Vaccination Modal */}
      <Modal
        isOpen={openModal === 'vaccination'}
        onClose={closeModal}
        title={`${t('additionalInfo.tabs.vaccination')} - ${animal} (${subSpecies})`}
      >
        {renderVaccinationContent()}
      </Modal>

      {/* Therapies Modal */}
      <Modal
        isOpen={openModal === 'therapies'}
        onClose={closeModal}
        title={`${t('additionalInfo.tabs.therapies')} - ${animal} (${subSpecies})`}
      >
        {renderTherapiesContent()}
      </Modal>
    </div>
  );
};
