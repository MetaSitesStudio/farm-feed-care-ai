import { GoogleGenAI, Type } from "@google/genai";
import type { FeedIngredient, NutritionalTarget, IndustrialFeed, VaccinationScheduleResponse, AlternativeTherapiesResponse } from '../types';

// Get API key from environment variables at runtime
const getApiKey = (): string => {
  // In production (Netlify), GEMINI_API_KEY is available as import.meta.env.GEMINI_API_KEY
  // In development, we might use VITE_GEMINI_API_KEY
  const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found. Please set environment variable.');
  }
  
  return apiKey;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const model = 'gemini-2.5-flash'; // Back to working model

/**
 * A robust parser to extract a JSON object from a string that might contain markdown or other text.
 * @param text The raw string response from the AI.
 * @returns A parsed JavaScript object or null if parsing fails.
 */
const parseJsonFromResponse = (text: string): any => {
    try {
        // Handle markdown code blocks
        const sanitizedText = text.replace(/^```json\s*|```\s*$/g, '');
        const startIndex = sanitizedText.indexOf('{');
        const endIndex = sanitizedText.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            // No JSON object found
            return null;
        }
        const jsonString = sanitizedText.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
    } catch(e) {
        console.error("Failed to parse JSON from response substring:", e);
        // This indicates the extracted substring was not valid JSON
        return null;
    }
}


export const getFeedSuggestion = async (
  animal: string, 
  subSpecies: string,
  totalFeed: number,
  naturalIngredients: FeedIngredient[],
  industrialFeed: IndustrialFeed,
  targets: NutritionalTarget[],
  feedingMode: 'Direct' | 'Fermentation' = 'Direct',
): Promise<{name: string, weight: number}[]> => {
  try {
    const lockedIngredients = naturalIngredients.filter(i => i.locked).map(i => `${i.name} at ${i.weight.toFixed(2)} kg (Cost: ${i.pricePerKg || 0} PHP/kg)`).join(', ') || 'None';
    const availableIngredients = naturalIngredients
        .filter(i => !i.locked)
        .map(i => ` - ${i.name} (Cost: ${i.pricePerKg || 0} PHP/kg, Nutrients per 100g: ${JSON.stringify(i.nutrients)})`)
        .join('\n');

    const nutritionalTargetsString = targets.map(t => `${t.name}: ${t.target.toFixed(2)} per 100g of feed`).join(', ');

    const availableIngredientsPrompt = availableIngredients ? `
      2.  **Pool of Usable Natural Ingredients:** You can ONLY use the following ingredients to build the mix.
          ${availableIngredients}
    ` : `
      2.  **Pool of Usable Natural Ingredients:** None. Only use the locked ingredients and commercial feed.
    `;

    // Fermentation considerations (simplified for speed)
    const fermentationGuidance = feedingMode === 'Fermentation' ? 
      '\n**FERMENTATION MODE:** Prioritize rice bran, molasses, and fibrous ingredients. Reduce protein targets by 10%.' : '';

    const prompt = `Create a ${totalFeed.toFixed(2)}kg feed mix for ${animal} (${subSpecies}).${fermentationGuidance}

Targets (per 100g): ${nutritionalTargetsString}

Commercial feed: "${industrialFeed.name}" (${industrialFeed.pricePerKg}₱/kg) - ${JSON.stringify(industrialFeed.nutrients)}
${availableIngredientsPrompt}
Fixed: ${lockedIngredients}

Use 50-70% commercial feed + natural ingredients. Total must equal ${totalFeed.toFixed(2)}kg exactly. Meet nutrition targets ±5%.

JSON only: {"ingredients": [{"name": "...", "weight": 0.00}, ...]}`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const result = parseJsonFromResponse(response.text);

    if (!result || !result.ingredients) {
        console.error("Parsed JSON is null or invalid:", { text: response.text });
        throw new Error("The AI returned an invalid or empty response.");
    }
    
    return result.ingredients;

  } catch (error) {
    console.error("Error in getFeedSuggestion:", error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};

export const getVaccinationSchedule = async (animal: string, subSpecies: string): Promise<VaccinationScheduleResponse> => {
    try {
        const prompt = `Generate a typical vaccination schedule for ${animal} (${subSpecies}) in the Philippines. Provide the age, vaccine name, and purpose for each vaccination. Also include a brief introduction and any important concluding notes.`;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        introduction: { type: Type.STRING },
                        schedule: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    age: { type: Type.STRING },
                                    vaccine: { type: Type.STRING },
                                    purpose: { type: Type.STRING },
                                },
                                required: ['age', 'vaccine', 'purpose']
                            }
                        },
                        notes: { type: Type.STRING },
                    }
                }
            }
        });
        
        const result = parseJsonFromResponse(response.text);
        if (!result || !result.schedule) {
            throw new Error("AI returned invalid data for vaccination schedule.");
        }
        return result;
    } catch (error) {
        console.error("Error fetching vaccination schedule:", error);
        return {
            introduction: "Could not retrieve vaccination schedule at this time.",
            schedule: [],
            notes: "Please consult a licensed veterinarian for an official schedule."
        };
    }
};

// FIX: Removed local data lookup to fix import error and rely solely on the Gemini API.
export const getAlternativeTherapies = async (animal: string, subSpecies: string): Promise<AlternativeTherapiesResponse> => {
    try {
        const prompt = `Provide a list of common and safe alternative or natural therapies for ${animal} (${subSpecies}). Focus on practices known in Southeast Asia, particularly the Philippines. For each therapy, provide its name, its supposed benefit, and how it's administered. Also provide a brief introduction and a concluding disclaimer.`;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        introduction: { type: Type.STRING },
                        therapies: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    benefit: { type: Type.STRING },
                                    administration: { type: Type.STRING },
                                },
                                required: ['name', 'benefit', 'administration']
                            }
                        },
                        disclaimer: { type: Type.STRING },
                    }
                }
            }
        });
        
        const result = parseJsonFromResponse(response.text);
        if (!result || !result.therapies) {
            throw new Error("AI returned invalid data for alternative therapies.");
        }
        return result;
    } catch (error) {
        console.error("Error fetching alternative therapies:", error);
        return {
            introduction: "Could not retrieve alternative therapies at this time.",
            therapies: [],
            disclaimer: "Information is not available. Always consult a professional."
        };
    }
};

export const getFermentationGuidance = async (animal: string, subSpecies: string, feedIngredients: string[]): Promise<{ guidance: string; steps: string[]; tips: string[] }> => {
    try {
        const ingredientsList = feedIngredients.join(', ');
        const prompt = `Generate fermentation guidance for ${animal} (${subSpecies}) feed using these ingredients: ${ingredientsList}. 
        
        Provide:
        1. A brief introduction about fermentation benefits for this animal
        2. Step-by-step fermentation process (5-7 steps)
        3. Practical tips for farmers in the Philippines
        
        Focus on local practices, simple equipment, and cost-effective methods.`;
        
        // Use existing ai instance
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        guidance: { type: Type.STRING },
                        steps: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        tips: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const result = parseJsonFromResponse(response.text);
        if (!result) {
            throw new Error("AI returned invalid data for fermentation guidance.");
        }
        return result;
    } catch (error) {
        console.error("Error fetching fermentation guidance:", error);
        return {
            guidance: "Could not retrieve fermentation guidance at this time.",
            steps: ["Please consult a fermentation guide or agricultural extension worker."],
            tips: ["Always ensure proper hygiene when fermenting animal feeds."]
        };
    }
};