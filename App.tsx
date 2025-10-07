
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimalSelector } from './components/AnimalSelector';
import { Parameters } from './components/Parameters';
import { MixWeights } from './components/MixWeights';
import { NutrientBlends } from './components/NutrientBlends';
import { TargetsComparison } from './components/TargetsComparison';
import { AdditionalInfo } from './components/AdditionalInfo';
import { Header } from './components/Header';
import { CommercialFeed } from './components/CommercialFeed';
import { MineralSupplementSuggestions } from './components/MineralSupplementSuggestions';
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
  const [baseTargets, setBaseTargets] = useState<NutritionalTarget[]>([]);

  // Compute targets on-the-fly to prevent stale state
  const targets: Nutrient[] = useMemo(() => {
    const recommendedFeed = selectedAnimal.recommendedFeed?.[subSpecies] || 150;
    const animalTargets = (NUTRITIONAL_TARGETS[selectedAnimal.name]?.[subSpecies] || []) as NutritionalTarget[];
    
    return animalTargets.map(t => {
      const nutrientDef = {
        name: t.name,
        unit: t.name.match(/\(([^)]+)\)/)?.[1] || '',
      };
      
      // Calculate daily goal per animal for UI display
      const baseGoal = t.target * (recommendedFeed / 100);
      
      // Find corresponding nutrient value from current calculations
      const currentNutrient = nutrients.find(n => n.name === t.name);
      const value = currentNutrient?.value || 0;
      
      // Calculate status
      const goalMin = baseGoal * 0.95;
      const goalMax = baseGoal * 1.15;
      let status: 'Low' | 'Met' | 'High' | 'N/A' = 'N/A';
      
      if (value > 0) {
        if (value < goalMin) status = 'Low';
        else if (value > goalMax) status = 'High';
        else status = 'Met';
      }
      
      return {
        ...nutrientDef,
        value,
        goalMin,
        goalMax,
        status
      };
    });
  }, [selectedAnimal, subSpecies, nutrients]);

  const totalFeed = (params.numberOfAnimals * params.feedPerAnimal * params.dailyTotalScaling) / 1000;

  // Effect to update targets and reset mix when animal/subspecies changes
  useEffect(() => {
    // 1. Determine recommended feed and update params
    const recommendedFeed = selectedAnimal.recommendedFeed?.[subSpecies] || 150; // Fallback
    setParams(prev => ({ ...prev, feedPerAnimal: recommendedFeed }));

    // 2. Calculate total feed based on the new recommended amount
    const newTotalFeed = (params.numberOfAnimals * recommendedFeed * params.dailyTotalScaling) / 1000;

    // 3. Store base targets for AI (no more computed targets in state)
    const animalTargets = (NUTRITIONAL_TARGETS[selectedAnimal.name]?.[subSpecies] || []) as NutritionalTarget[];
    setBaseTargets(animalTargets); // Store the base "per 100g" targets for the AI
    
    // 4. Update commercial feed with intelligent sizing
    const suitableIndustrialFeed = INDUSTRIAL_FEEDS.find(f => f.subSpecies?.includes(subSpecies)) || INDUSTRIAL_FEEDS.find(f => f.animal.includes(selectedAnimal.name));
    if (suitableIndustrialFeed) {
        // Calculate what ratio of commercial feed needed to hit target nutrients
        // Use actual nutritional targets for this specific animal/subspecies
        const energyTarget = animalTargets?.find(t => t.name === 'Energy (kcal)')?.target || 280;
        const proteinTarget = animalTargets?.find(t => t.name === 'Protein (g)')?.target || 16;
        
        const targetEnergy = energyTarget; // kcal per 100g of final mix - SPECIFIC TO ANIMAL
        const targetProtein = proteinTarget; // g protein per 100g of final mix - SPECIFIC TO ANIMAL
        
        const energyDensity = suitableIndustrialFeed.nutrients.energy; // kcal per 100g
        const proteinDensity = suitableIndustrialFeed.nutrients.protein; // g per 100g
        
        console.log(`${selectedAnimal.name} (${subSpecies}) - Target: ${targetEnergy} kcal, ${targetProtein}g protein`);
        console.log(`Feed: ${suitableIndustrialFeed.name}, Energy: ${energyDensity}, Protein: ${proteinDensity}`);
        
        // Calculate commercial feed ratio needed to achieve target energy
        // Formula: commercialRatio * energyDensity + (1-commercialRatio) * fillerEnergy = targetEnergy
        // Assuming fillers have ~40 kcal/100g average
        const fillerEnergy = 40;
        const energyRatio = (targetEnergy - fillerEnergy) / (energyDensity - fillerEnergy);
        
        // Calculate commercial feed ratio needed to achieve target protein  
        // Assuming fillers have ~1% protein average
        const fillerProtein = 1;
        const proteinRatio = (targetProtein - fillerProtein) / (proteinDensity - fillerProtein);
        
        // Use the more restrictive ratio (lower value)
        let commercialFeedRatio = Math.min(energyRatio, proteinRatio);
        commercialFeedRatio = Math.max(0.3, Math.min(1.0, commercialFeedRatio)); // Clamp between 30% and 100%
        
        console.log(`Energy ratio: ${energyRatio.toFixed(3)}, Protein ratio: ${proteinRatio.toFixed(3)}, Final: ${commercialFeedRatio.toFixed(3)}`);
        
        const optimizedCommercialWeight = Math.round(newTotalFeed * commercialFeedRatio * 100) / 100;
        console.log(`Total feed: ${newTotalFeed}kg, Ratio: ${commercialFeedRatio}, Commercial: ${optimizedCommercialWeight}kg`);
        
        setIndustrialFeed({ 
            ...suitableIndustrialFeed, 
            weight: optimizedCommercialWeight,
            originalWeight: newTotalFeed, // Store original for reference
            ratio: commercialFeedRatio
        });
        
        // Add filler ingredients if commercial feed was reduced
        if (commercialFeedRatio < 0.9) {
            console.log('Adding filler ingredients...');
            const fillerWeight = newTotalFeed - optimizedCommercialWeight;
            const fillerIngredients = [
                { 
                    name: 'Rice Hulls', 
                    weight: fillerWeight * 0.7, 
                    pricePerKg: 8, 
                    locked: false,
                    nutrients: { energy: 35, protein: 0.8, fat: 0.3, fiber: 45, calcium: 0.03, phosphorus: 0.03 }
                },
                { 
                    name: 'Corn Cob Meal', 
                    weight: fillerWeight * 0.3, 
                    pricePerKg: 12, 
                    locked: false,
                    nutrients: { energy: 50, protein: 1.5, fat: 0.5, fiber: 35, calcium: 0.05, phosphorus: 0.08 }
                }
            ];
            setNaturalIngredients(fillerIngredients);
        } else {
            setNaturalIngredients([]);
        }
    } else {
        setIndustrialFeed(null);
        setNaturalIngredients([]);
    }
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
        return;
    }

    allIngredients.forEach(ing => {
      if (ing.weight > 0 && ing.nutrients) {
        const proportion = ing.weight / currentTotalWeight;
        newNutrients[0].value += (ing.nutrients.energy * proportion);
        newNutrients[1].value += (ing.nutrients.protein * proportion);
        newNutrients[2].value += (ing.nutrients.fat * proportion);
        newNutrients[3].value += (ing.nutrients.fiber * proportion);
        newNutrients[4].value += (ing.nutrients.calcium * proportion);
        newNutrients[5].value += (ing.nutrients.phosphorus * proportion);
      }
    });
    // Convert nutrients to per-animal values for the targets display
    const perAnimalFactor = params.feedPerAnimal / 100;
    const nutrientsPerAnimal = newNutrients.map(nutrient => ({
      ...nutrient,
      value: nutrient.value * perAnimalFactor
    }));
    
    setNutrients(nutrientsPerAnimal);
  }, [naturalIngredients, industrialFeed, params.feedPerAnimal]);

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
    <div className="min-h-screen bg-gray-50 text-gray-800 p-2 sm:p-4 lg:p-8 font-sans">
      <div className="max-w-screen-2xl mx-auto">
        <Header />
        
        <main className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-1">
              <AnimalSelector 
                animals={ANIMALS}
                selectedAnimal={selectedAnimal}
                onAnimalChange={handleAnimalChange}
                subSpecies={subSpecies}
                onSubSpeciesChange={handleSubSpeciesChange}
              />
            </div>
            <div className="lg:col-span-2">
              <Parameters params={params} totalFeed={totalFeed} onParamChange={handleParamChange} />
            </div>
          </div>

          {industrialFeed && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
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
          
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
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
              nutrients={nutrients}
              targets={targets}
              feedPerAnimal={params.feedPerAnimal}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
              <NutrientBlends nutrients={nutrients} totalFeed={totalFeed} feedPerAnimal={params.feedPerAnimal} />
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
              <TargetsComparison targets={targets} />
            </div>
          </div>
          

          
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
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