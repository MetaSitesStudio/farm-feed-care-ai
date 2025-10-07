
import React, { useState, useEffect, useCallback } from 'react';
import { AnimalSelector } from './components/AnimalSelector';
import { Parameters } from './components/Parameters';
import { MixWeights } from './components/MixWeights';
import { NutrientBlends } from './components/NutrientBlends';
import { TargetsComparison } from './components/TargetsComparison';
import { AdditionalInfo } from './components/AdditionalInfo';
import { Header } from './components/Header';
import { CommercialFeed } from './components/CommercialFeed';
import type { Animal, FeedIngredient, Nutrient, FeedingParameters, FeedMode, IndustrialFeedWithWeight, NutritionalTarget } from './types';
import { ANIMALS, PHILIPPINE_FEEDS, INDUSTRIAL_FEEDS, NUTRITIONAL_TARGETS } from './constants';

const App: React.FC = () => {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal>(ANIMALS[0]);
  const [subSpecies, setSubSpecies] = useState<string>(ANIMALS[0].subSpecies[0]);
  
  const [params, setParams] = useState<FeedingParameters>({
    numberOfAnimals: 100,
    feedPerAnimal: 150,
    dailyTotalScaling: 1,
    mode: 'Direct',
    feedingsPerDay: 1,
  });

  const [naturalIngredients, setNaturalIngredients] = useState<FeedIngredient[]>([]);
  const [industrialFeed, setIndustrialFeed] = useState<IndustrialFeedWithWeight | null>(null);
  
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [targets, setTargets] = useState<Nutrient[]>([]);
  const [baseTargets, setBaseTargets] = useState<NutritionalTarget[]>([]);

  const totalFeed = (params.numberOfAnimals * params.feedPerAnimal * params.dailyTotalScaling) / 1000;

  // Effect to update targets and reset mix when animal/subspecies changes
  useEffect(() => {
    // 1. Determine recommended feed and update params
    const recommendedFeed = selectedAnimal.recommendedFeed?.[subSpecies] || 150; // Fallback
    setParams(prev => ({ ...prev, feedPerAnimal: recommendedFeed }));

    // 2. Calculate total feed based on the new recommended amount
    const newTotalFeed = (params.numberOfAnimals * recommendedFeed * params.dailyTotalScaling) / 1000;

    // 3. Update nutritional targets based on recommendedFeed
    const animalTargets = (NUTRITIONAL_TARGETS[selectedAnimal.name]?.[subSpecies] || []) as NutritionalTarget[];
    setBaseTargets(animalTargets); // Store the base "per 100g" targets for the AI
    
    const newTargets: Nutrient[] = animalTargets.map(t => {
      const nutrientDef = {
        name: t.name,
        value: 0,
        unit: t.name.match(/\(([^)]+)\)/)?.[1] || '',
      };
      // Calculate daily goal per animal for UI display
      const baseGoal = t.target * (recommendedFeed / 100);
      return {
          ...nutrientDef,
          goalMin: baseGoal * 0.95, // 5% tolerance below
          goalMax: baseGoal * 1.15, // 15% tolerance above
          status: 'N/A'
      };
    });
    setTargets(newTargets);
    
    // 4. Update commercial feed based on newTotalFeed
    const suitableIndustrialFeed = INDUSTRIAL_FEEDS.find(f => f.subSpecies?.includes(subSpecies)) || INDUSTRIAL_FEEDS.find(f => f.animal.includes(selectedAnimal.name));
    if (suitableIndustrialFeed) {
        setIndustrialFeed({ ...suitableIndustrialFeed, weight: newTotalFeed });
    } else {
        setIndustrialFeed(null);
    }

    // 5. Reset natural ingredients
    setNaturalIngredients([]);
  }, [selectedAnimal, subSpecies, params.numberOfAnimals, params.dailyTotalScaling]);


  const calculateNutrients = useCallback(() => {
    const totalNaturalWeight = naturalIngredients.reduce((sum, ing) => sum + ing.weight, 0);
    const industrialWeight = industrialFeed ? industrialFeed.weight : 0;
    const currentTotalWeight = totalNaturalWeight + industrialWeight;
    
    const allIngredients = [
        ...naturalIngredients,
        ...(industrialFeed ? [{...industrialFeed, name: industrialFeed.name}] : [])
    ];

    const newNutrients: Nutrient[] = [
        { name: 'Energy (kcal)', value: 0, unit: 'kcal' },
        { name: 'Protein (g)', value: 0, unit: 'g' },
        { name: 'Fat (g)', value: 0, unit: 'g' },
        { name: 'Crude Fiber (g)', value: 0, unit: 'g' },
        { name: 'Calcium (g)', value: 0, unit: 'g' },
        { name: 'Phosphorus (g)', value: 0, unit: 'g' },
    ];
    
    if (currentTotalWeight === 0) {
        setNutrients(newNutrients);
        setTargets(prev => prev.map(t => ({...t, value: 0, status: 'Low'})));
        return;
    }

    allIngredients.forEach(ing => {
      if (ing.weight > 0) {
        const proportion = ing.weight / currentTotalWeight;
        newNutrients[0].value += (ing.nutrients.energy * proportion);
        newNutrients[1].value += (ing.nutrients.protein * proportion);
        newNutrients[2].value += (ing.nutrients.fat * proportion);
        newNutrients[3].value += (ing.nutrients.fiber * proportion);
        newNutrients[4].value += (ing.nutrients.calcium * proportion);
        newNutrients[5].value += (ing.nutrients.phosphorus * proportion);
      }
    });
    setNutrients(newNutrients);

    const newTargets = [...targets];
    if (newTargets.length > 0) {
      const perAnimalFactor = params.feedPerAnimal / 100;
      
      const nutrientValuesPerAnimal = {
          'Energy (kcal)': newNutrients[0].value * perAnimalFactor,
          'Protein (g)': newNutrients[1].value * perAnimalFactor,
          'Crude Fiber (g)': newNutrients[3].value * perAnimalFactor,
          'Calcium (g)': newNutrients[4].value * perAnimalFactor,
          'Phosphorus (g)': newNutrients[5].value * perAnimalFactor,
      };

      const updatedTargets = newTargets.map(target => {
          const value = nutrientValuesPerAnimal[target.name as keyof typeof nutrientValuesPerAnimal] || 0;
          let status: 'Low' | 'Met' | 'High' = 'Met';
          if (value < (target.goalMin ?? 0)) status = 'Low';
          if (value > (target.goalMax ?? Infinity)) status = 'High';
          return {...target, value: parseFloat(value.toFixed(2)), status };
      });
      setTargets(updatedTargets);
    }
  }, [naturalIngredients, industrialFeed, params.feedPerAnimal, targets]);

  useEffect(() => {
    calculateNutrients();
  }, [naturalIngredients, industrialFeed, params.feedPerAnimal, calculateNutrients]);

  const handleAnimalChange = (animalName: string) => {
    const animal = ANIMALS.find(a => a.name === animalName);
    if (animal) {
      setSelectedAnimal(animal);
      setSubSpecies(animal.subSpecies[0]);
    }
  };

  const handleSubSpeciesChange = (sub: string) => {
    setSubSpecies(sub);
  };

  const handleParamChange = (field: keyof FeedingParameters, value: number | FeedMode) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };
  
  const addNaturalIngredient = (ingredientName: string) => {
    const ingredientToAdd = PHILIPPINE_FEEDS.find(ing => ing.name === ingredientName);
    if (ingredientToAdd && !naturalIngredients.some(ing => ing.name === ingredientName)) {
      setNaturalIngredients(prev => [...prev, {...ingredientToAdd, weight: 0, locked: false, pricePerKg: 0}]);
    }
  };

  const removeNaturalIngredient = (index: number) => {
    const ingredientToRemove = naturalIngredients[index];
    const newIngredients = naturalIngredients.filter((_, i) => i !== index);
    setNaturalIngredients(newIngredients);

    // After removing, we need to adjust the commercial feed weight to maintain the total.
    if (industrialFeed) {
        const newIndustrialWeight = industrialFeed.weight + ingredientToRemove.weight;
        setIndustrialFeed(prev => prev ? {...prev, weight: newIndustrialWeight } : null);
    }
  };

  const handleNaturalIngredientChange = (index: number, newWeightKg: number) => {
    const newIngredients = [...naturalIngredients];
    newIngredients[index].weight = Math.max(0, newWeightKg);
    setNaturalIngredients(newIngredients);

    const newTotalNaturalWeight = newIngredients.reduce((sum, ing) => sum + ing.weight, 0);
    if (industrialFeed) {
        const newIndustrialWeight = Math.max(0, totalFeed - newTotalNaturalWeight);
        setIndustrialFeed(prev => prev ? {...prev, weight: newIndustrialWeight} : null);
    }
  };

  const handleNaturalIngredientPriceChange = (index: number, newPrice: number) => {
    const newIngredients = [...naturalIngredients];
    newIngredients[index].pricePerKg = Math.max(0, newPrice); // Ensure price isn't negative
    setNaturalIngredients(newIngredients);
  };
  
  const handleLockToggle = (index: number) => {
    const newIngredients = [...naturalIngredients];
    newIngredients[index].locked = !newIngredients[index].locked;
    setNaturalIngredients(newIngredients);
  };
  
  const handleIndustrialFeedTypeChange = (feedName: string) => {
    const newFeed = INDUSTRIAL_FEEDS.find(f => f.name === feedName);
    if (newFeed && industrialFeed) {
        setIndustrialFeed({...newFeed, weight: industrialFeed.weight});
    }
  };

  const handleIndustrialFeedPriceChange = (newPrice: number) => {
    if (industrialFeed) {
        setIndustrialFeed(prev => prev ? {...prev, pricePerKg: Math.max(0, newPrice)} : null);
    }
  };

  const resetMix = () => {
    if (industrialFeed) {
      setIndustrialFeed(prev => prev ? {...prev, weight: totalFeed} : null);
    }
    setNaturalIngredients([]);
  };

  const naturalIngredientsCost = naturalIngredients.reduce((sum, ing) => sum + (ing.weight * (ing.pricePerKg || 0)), 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 lg:p-8 font-sans">
      <div className="max-w-screen-2xl mx-auto">
        <Header />
        
        <main className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimalSelector 
              animals={ANIMALS}
              selectedAnimal={selectedAnimal}
              onAnimalChange={handleAnimalChange}
              subSpecies={subSpecies}
              onSubSpeciesChange={handleSubSpeciesChange}
            />
            <div className="md:col-span-2">
                 <Parameters params={params} totalFeed={totalFeed} onParamChange={handleParamChange} />
            </div>
          </div>

          {industrialFeed && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <CommercialFeed 
                    selectedFeed={industrialFeed}
                    onFeedChange={handleIndustrialFeedTypeChange}
                    onPriceChange={handleIndustrialFeedPriceChange}
                    animal={selectedAnimal.name}
                    totalFeed={totalFeed}
                    naturalIngredientsCost={naturalIngredientsCost}
                />
            </div>
          )}
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <MixWeights 
              ingredients={naturalIngredients}
              onIngredientChange={handleNaturalIngredientChange}
              onPriceChange={handleNaturalIngredientPriceChange}
              onLockToggle={handleLockToggle}
              totalFeed={totalFeed}
              onReset={resetMix}
              animal={selectedAnimal.name}
              subSpecies={subSpecies}
              setIngredients={setNaturalIngredients}
              setIndustrialFeed={setIndustrialFeed}
              industrialFeed={industrialFeed}
              baseTargets={baseTargets}
              addIngredient={addNaturalIngredient}
              removeIngredient={removeNaturalIngredient}
              feedingMode={params.mode}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <NutrientBlends nutrients={nutrients} totalFeed={totalFeed} feedPerAnimal={params.feedPerAnimal} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <TargetsComparison targets={targets} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <AdditionalInfo animal={selectedAnimal.name} subSpecies={subSpecies} />
          </div>
        </main>

        <footer className="text-center text-sm text-gray-500 mt-12 pb-4">
          <p>&copy; {new Date().getFullYear()} Farm Feed & Care AI. All rights reserved.</p>
          <p className="mt-1">Generated by a world-class senior frontend React engineer.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;