import { ParsedRecipeData } from '@/lib/types';

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
  }

  async parseIngredients(rawIngredients: string): Promise<ParsedRecipeData> {
    const prompt = `Parse the following recipe ingredients text into a structured JSON format:

Input: ${rawIngredients}

Return JSON with:
1. ingredients: array of {name, quantity, unit}
2. primary_protein: string (most prominent protein ingredient)
3. primary_carbohydrate: string (most prominent carb ingredient)  
4. primary_vegetable: string (most prominent vegetable ingredient)
5. is_valid_meal: boolean (has at least 2 of protein/carb/vegetable)

Important guidelines:
- For proteins: include meats, fish, poultry, eggs, beans, legumes, tofu, etc.
- For carbohydrates: include rice, pasta, bread, potatoes, grains, etc.
- For vegetables: include fresh vegetables, herbs (not just garnish amounts)
- Only return the most prominent ingredient for each category
- A meal needs at least 2 of the 3 categories to be valid
- If quantity is unclear, estimate reasonably
- Standardize units (cups, tbsp, tsp, lb, oz, etc.)

Example output:
{
  "ingredients": [
    {"name": "chicken breast", "quantity": "1", "unit": "lb"},
    {"name": "rice", "quantity": "2", "unit": "cups"},
    {"name": "broccoli", "quantity": "1", "unit": "head"}
  ],
  "primary_protein": "chicken breast",
  "primary_carbohydrate": "rice",
  "primary_vegetable": "broccoli",
  "is_valid_meal": true
}

Return only the JSON object without backticks, no additional text.`;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON response
      try {
        const parsedData = JSON.parse(content);
        
        // Validate the response structure
        if (!parsedData.ingredients || !Array.isArray(parsedData.ingredients)) {
          throw new Error('Invalid response: missing or invalid ingredients array');
        }

        // Ensure all required fields are present
        const result: ParsedRecipeData = {
          ingredients: parsedData.ingredients,
          primary_protein: parsedData.primary_protein || '',
          primary_carbohydrate: parsedData.primary_carbohydrate || '',
          primary_vegetable: parsedData.primary_vegetable || '',
          is_valid_meal: parsedData.is_valid_meal || false,
        };

        return result;
      } catch (jsonError) {
        console.error('Failed to parse OpenAI response as JSON:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
