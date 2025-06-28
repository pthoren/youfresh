export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
  provider_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  raw_ingredients: string;
  parsed_ingredients?: Ingredient[];
  primary_protein?: string;
  primary_carbohydrate?: string;
  primary_vegetable?: string;
  last_ordered_at?: Date;
  total_orders: number;
  created_at: Date;
  updated_at: Date;
}

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  recipe_ids: string[];
  grocery_list?: Ingredient[];
  created_at: Date;
  updated_at: Date;
}

export interface ParsedRecipeData {
  ingredients: Ingredient[];
  primary_protein: string;
  primary_carbohydrate: string;
  primary_vegetable: string;
  is_valid_meal: boolean;
  image_filename?: string;
}

export interface RecipeSuggestion {
  recipe: Recipe;
  reason: string;
  score: number;
}

export function getImageUrlFromRecipe(recipe: Recipe): string | null {
  if (!recipe.parsed_ingredients) return null;
  
  try {
    const parsed = typeof recipe.parsed_ingredients === 'string' 
      ? JSON.parse(recipe.parsed_ingredients) 
      : recipe.parsed_ingredients;
    
    // Returns the full image URL stored in image_filename field
    return parsed.image_filename || null;
  } catch (error) {
    console.error('Error parsing recipe ingredients:', error);
    return null;
  }
}

export function getIngredientsFromRecipe(recipe: Recipe): Ingredient[] {
  if (!recipe.parsed_ingredients) return [];
  
  try {
    const parsed = typeof recipe.parsed_ingredients === 'string' 
      ? JSON.parse(recipe.parsed_ingredients) 
      : recipe.parsed_ingredients;
    
    return parsed.ingredients || [];
  } catch (error) {
    console.error('Error parsing recipe ingredients:', error);
    return [];
  }
}

export function shouldShowImageLoading(recipe: Recipe): boolean {
  // Show loading for recipes created/updated in the last 5 minutes that don't have images yet
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recipeDate = new Date(recipe.updated_at || recipe.created_at);
  
  return recipeDate > fiveMinutesAgo && !getImageUrlFromRecipe(recipe);
}
