
import React from 'react';
import type { Animal } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface AnimalSelectorProps {
  animals: Animal[];
  selectedAnimal: Animal;
  onAnimalChange: (animalName: string) => void;
  subSpecies: string;
  onSubSpeciesChange: (subSpecies: string) => void;
}

export const AnimalSelector: React.FC<AnimalSelectorProps> = ({
  animals,
  selectedAnimal,
  onAnimalChange,
  subSpecies,
  onSubSpeciesChange,
}) => {
  const { t } = useTranslation();

  const getAnimalTranslationKey = (animalName: string) => `animals.${animalName.toLowerCase().replace(' ', '')}`;
  const getSubspeciesTranslationKey = (subSpeciesName: string) => `subspecies.${subSpeciesName.toLowerCase().replace(/ /g, '')}`;


  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 h-full">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{t('animalSelector.title')}</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="animal-select" className="block text-sm font-medium text-gray-600 mb-1">
            {t('animalSelector.animalTypeLabel')}
          </label>
          <select
            id="animal-select"
            value={selectedAnimal.name}
            onChange={(e) => onAnimalChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition bg-gray-700 text-white border-gray-600"
          >
            {animals.map((animal) => (
              <option key={animal.name} value={animal.name}>
                {t(getAnimalTranslationKey(animal.name))}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subspecies-select" className="block text-sm font-medium text-gray-600 mb-1">
            {t('animalSelector.subspeciesLabel')}
          </label>
          <select
            id="subspecies-select"
            value={subSpecies}
            onChange={(e) => onSubSpeciesChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition bg-gray-700 text-white border-gray-600"
          >
            {selectedAnimal.subSpecies.map((sub) => (
              <option key={sub} value={sub}>
                {t(getSubspeciesTranslationKey(sub))}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
