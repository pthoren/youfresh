import { openaiService } from './openai';

export type ImageStyle = 'minimalist' | 'realistic' | 'illustration' | 'overhead';

export interface ImageGenerationOptions {
  style: ImageStyle;
  recipeName: string;
  ingredients: string[];
  userUuid: string;
}

export class RecipeImageService {
  private getPromptForStyle(options: ImageGenerationOptions): string {
    const { style, recipeName, ingredients } = options;
    const mainIngredients = ingredients.slice(0, 3); // Limit complexity

    switch (style) {
      case 'minimalist':
        return `Minimalist food photography of ${recipeName}. Clean white background, single serving on simple white plate, natural lighting. Features ${mainIngredients.join(', ')}. No garnishes, no text, simple composition.`;

      case 'overhead':
        return `Overhead flat lay food photography of ${recipeName}. Bird's eye view, centered on white background. Clean presentation with ${mainIngredients.join(' and ')}. Minimal styling, no hands visible.`;

      case 'illustration':
        return `Simple, clean food illustration of ${recipeName}. Cartoon style, minimal details, bright colors. Shows ${mainIngredients.join(' and ')}. Vector art style, no realistic textures.`;

      case 'realistic':
        return `Professional food photography of ${recipeName} in natural setting. Well-lit, appetizing presentation featuring ${mainIngredients.join(', ')}. Restaurant quality plating, warm lighting, shallow depth of field.`;

      default:
        return this.getPromptForStyle({ ...options, style: 'minimalist' });
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<string | null> {
    const prompt = this.getPromptForStyle(options);
    
    try {
      return await openaiService.generateRecipeImage(
        options.recipeName,
        options.ingredients,
        options.userUuid,
        prompt
      );
    } catch (error) {
      console.error(`Failed to generate ${options.style} image:`, error);
      
      // Fallback to minimalist style if the original fails
      if (options.style !== 'minimalist') {
        console.log('Falling back to minimalist style...');
        return this.generateImage({ ...options, style: 'minimalist' });
      }
      
      return null;
    }
  }

  // Generate multiple style options for testing
  async generateImageOptions(recipeName: string, ingredients: string[], userUuid: string): Promise<Record<ImageStyle, string | null>> {
    const styles: ImageStyle[] = ['minimalist', 'overhead', 'illustration', 'realistic'];
    const results: Partial<Record<ImageStyle, string | null>> = {};

    for (const style of styles) {
      console.log(`Generating ${style} image for ${recipeName}...`);
      try {
        results[style] = await this.generateImage({
          style,
          recipeName,
          ingredients,
          userUuid: `${userUuid}_${style}`
        });
      } catch (error) {
        console.error(`Failed to generate ${style} image:`, error);
        results[style] = null;
      }
    }

    return results as Record<ImageStyle, string | null>;
  }
}

export const recipeImageService = new RecipeImageService();
