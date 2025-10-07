import { GoogleGenAI, Type } from "@google/genai";
import type { FeedIngredient, NutritionalTarget, IndustrialFeed, VaccinationScheduleResponse, AlternativeTherapiesResponse } from '../types';

// FIX: Correctly initialize GoogleGenAI and use API_KEY from environment variables directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

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

    const prompt = `
      As an expert animal nutritionist in the Philippines, your task is to solve a feed formulation problem with a primary goal of minimizing cost for a farmer.

      **Goal:** Create the absolute cheapest feed mix for a ${animal} (${subSpecies}) that weighs exactly ${totalFeed.toFixed(2)} kg, while staying within healthy nutritional guidelines. Your primary objective is to minimize the total cost.

      **Nutritional Guidelines (per 100g of the final mix):**
      These are important targets, but some flexibility is allowed to achieve the lowest possible cost.
      ${nutritionalTargetsString}

      **Available Components & Costs:**
      1.  **Baseline Commercial Feed:** "${industrialFeed.name}" (Cost: ${industrialFeed.pricePerKg.toFixed(2)} PHP/kg, Nutrients per 100g: ${JSON.stringify(industrialFeed.nutrients)}).
      ${availableIngredientsPrompt}

      **Fixed Constraints:**
      - **Locked Ingredients:** You MUST use the exact weights and costs for these: ${lockedIngredients}.
      - **Total Weight:** The final mix MUST weigh exactly ${totalFeed.toFixed(2)} kg.

      **Optimization Objective:**
      Your main goal is to **MINIMIZE THE TOTAL COST** of the final mix. The total cost is the sum of (weight * cost_per_kg) for every single ingredient used.
      - Use the provided ingredient costs to make economic trade-offs.
      - Maximize cheap, nutritionally adequate natural ingredients and minimize expensive commercial feed or pricey natural ingredients.
      - Create a *reasonable and healthy* mix. Do not create a mix that is dangerously low on critical nutrients, especially protein.
      - Strive to get as close as possible to the nutritional guidelines. A small deviation (e.g., 5-10%) from the targets is acceptable if it allows for significant cost savings.
      - The final mix should be a practical recipe a farmer would actually use.

      **Output Instructions:**
      - Provide your response as a single, valid JSON object.
      - The object must have one key: "ingredients".
      - "ingredients" must be an array of objects.
      - Each object must have "name" (string) and "weight" (number in kg).
      - Your response must include all ingredients from the "Pool of Usable Natural Ingredients", any "Locked Ingredients", and the "Baseline Commercial Feed", with their calculated weights (which can be 0).
      - Do not include any other text, explanation, or markdown.
    `;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  weight: { type: Type.NUMBER }
                },
                required: ['name', 'weight']
              }
            }
          }
        }
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