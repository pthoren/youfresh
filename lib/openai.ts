import { ParsedRecipeData } from '@/lib/types';
import OpenAI from 'openai';
import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export class OpenAIService {
  private client: OpenAI;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY!;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
    });
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
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content?.trim();

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

  async generateRecipeImage(recipeName: string, ingredients: string[], userUuid: string, customPrompt?: string): Promise<string | null> {
    try {
      // Check if blob storage is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.warn('BLOB_READ_WRITE_TOKEN not configured, skipping image generation');
        return null;
      }

      // Use custom prompt if provided, otherwise create a simple, positive-only prompt
      const prompt = customPrompt || `${recipeName} served in white bowl, overhead view, food photography`;

      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        console.error('No image URL received from OpenAI');
        return null;
      }

      // Download the image from OpenAI
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      
      const buffer = await imageResponse.arrayBuffer();
      
      // Create a unique filename using user ID and recipe info
      const sanitizedRecipeName = recipeName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
      const filename = `recipe-images/${userUuid}_${sanitizedRecipeName}_${uuidv4()}.png`;
      
      // Upload to Vercel blob storage with proper configuration
      const blobOptions: any = {
        access: 'public',
        contentType: 'image/png',
      };
      
      // Add store ID if specified in environment
      if (process.env.BLOB_STORE_ID) {
        blobOptions.storeId = process.env.BLOB_STORE_ID;
      }
      
      const blob = await put(filename, buffer, blobOptions);
      
      console.log(`Recipe image uploaded to blob storage: ${filename}`);
      console.log(`Blob URL: ${blob.url}`);
      
      // Return the full blob URL for storage in database
      return blob.url;
    } catch (error) {
      console.error('Error generating recipe image:', error);
      return null;
    }
  }

  async deleteImage(blobUrl: string): Promise<void> {
    try {
      // Extract the filename from the blob URL
      const filename = blobUrl.split('/').pop();
      if (!filename) {
        throw new Error('Invalid blob URL, unable to extract filename');
      }
      
      // Delete the blob from Vercel storage
      const result = await del(filename);
      console.log(`Blob deleted: ${filename}`, result);
    } catch (error) {
      console.error('Error deleting blob:', error);
    }
  }

  /**
   * Delete an image from blob storage
   */
  async deleteRecipeImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl) {
        return true; // Nothing to delete
      }

      // Check if it's a blob URL (production) or skip if it's a local file
      if (imageUrl.includes('blob.vercel-storage.com')) {
        await del(imageUrl);
        console.log(`Deleted image from blob storage: ${imageUrl}`);
      } else {
        console.log(`Skipping deletion of non-blob URL: ${imageUrl}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting recipe image:', error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
