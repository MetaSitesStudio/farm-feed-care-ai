

export interface Animal {
  name: string;
  subSpecies: string[];
  recommendedFeed: { [key: string]: number }; // in grams
}

export interface NutrientProfile {
  energy: number; // kcal/100g
  protein: number; // g/100g
  fat: number; // g/100g
  fiber: number; // g/100g
  calcium: number; // g/100g
  phosphorus: number; // g/100g
}

export interface FeedIngredient {
  name: string;
  weight: number; // Now in kg
  locked: boolean;
  nutrients: NutrientProfile;
  pricePerKg?: number; // Price per kg in PHP, optional for foraged items
}

export interface Nutrient {
  name:string;
  value: number;
  unit: string;
  goalMin?: number;
  goalMax?: number;
  status?: 'Low' | 'Met' | 'High' | 'N/A';
}

export type FeedMode = 'Direct' | 'Fermentation';

export interface FeedingParameters {
  numberOfAnimals: number;
  feedPerAnimal: number; // in grams
  dailyTotalScaling: number;
  mode: FeedMode;
  feedingsPerDay: number;
}

// New Types for Commercial Feeds and Nutritional Targets
export interface NutritionalTarget {
  name: 'Energy (kcal)' | 'Protein (g)' | 'Fat (g)' | 'Crude Fiber (g)' | 'Calcium (g)' | 'Phosphorus (g)';
  // Target value per 100g of total feed mix
  target: number; 
}

export interface AnimalTargets {
  [key: string]: NutritionalTarget[]; // Key is subSpecies
}

export interface IndustrialFeed {
  name: string;
  animal: string[];
  subSpecies?: string[];
  nutrients: NutrientProfile;
  pricePerKg: number; // in PHP
}

export interface IndustrialFeedWithWeight extends IndustrialFeed {
  weight: number; // in kg
  originalWeight?: number; // Original total feed weight
  ratio?: number; // Percentage of total feed that is commercial (0.0 to 1.0)
}

// For structured vaccination schedule response
export interface Vaccination {
  age: string;
  vaccine: string;
  purpose: string;
}

export interface VaccinationScheduleResponse {
  introduction: string;
  schedule: Vaccination[];
  notes: string;
}

// For structured alternative therapies response
export interface Therapy {
  name: string;
  benefit: string;
  administration: string;
}

export interface AlternativeTherapiesResponse {
  introduction: string;
  therapies: Therapy[];
  disclaimer: string;
}