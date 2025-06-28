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
}

export interface RecipeSuggestion {
  recipe: Recipe;
  reason: string;
  score: number;
}
