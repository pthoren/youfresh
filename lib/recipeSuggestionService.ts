import { Recipe, RecipeSuggestion } from '@/lib/types';

export class RecipeSuggestionService {
  
  /**
   * Suggest N recipes for meal planning with diversity and freshness scoring
   */
  static suggestRecipes(allRecipes: Recipe[], count: number = 3): RecipeSuggestion[] {
    if (allRecipes.length === 0) return [];
    
    // Score each recipe based on freshness and variety factors
    const scoredRecipes = allRecipes.map(recipe => ({
      recipe,
      score: this.calculateRecipeScore(recipe),
      reason: this.getRecipeReason(recipe)
    }));

    // Sort by score (higher is better)
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Apply diversity filter to avoid similar recipes
    const diverseRecipes = this.applyDiversityFilter(scoredRecipes, count);

    return diverseRecipes.slice(0, count);
  }

  /**
   * Calculate a score for recipe suggestion priority
   * Higher score = more likely to be suggested
   */
  private static calculateRecipeScore(recipe: Recipe): number {
    let score = 100; // Base score

    // Freshness factor (haven't ordered recently gets higher score)
    if (recipe.last_ordered_at) {
      const daysSinceOrdered = this.getDaysSince(new Date(recipe.last_ordered_at));
      
      if (daysSinceOrdered < 7) score -= 50;       // Ordered within a week
      else if (daysSinceOrdered < 14) score -= 25; // Ordered within 2 weeks
      else if (daysSinceOrdered < 30) score -= 10; // Ordered within a month
      else score += 20; // Ordered more than a month ago - boost it
    } else {
      score += 30; // Never ordered - give it a boost
    }

    // Variety factor (less frequently ordered gets higher score)
    if (recipe.total_orders === 0) score += 25;
    else if (recipe.total_orders === 1) score += 15;
    else if (recipe.total_orders === 2) score += 10;
    else if (recipe.total_orders >= 5) score -= 10;

    // Completeness factor (complete meals get slight boost)
    if (recipe.primary_protein && recipe.primary_carbohydrate && recipe.primary_vegetable) {
      score += 10;
    }

    return score;
  }

  /**
   * Apply diversity filter to avoid suggesting recipes with same primary ingredients
   */
  private static applyDiversityFilter(scoredRecipes: RecipeSuggestion[], count: number): RecipeSuggestion[] {
    const selected: RecipeSuggestion[] = [];
    const usedProteins = new Set<string>();
    const usedCarbs = new Set<string>();
    const usedVeggies = new Set<string>();

    for (const suggestion of scoredRecipes) {
      if (selected.length >= count) break;

      const recipe = suggestion.recipe;
      const protein = recipe.primary_protein?.toLowerCase();
      const carb = recipe.primary_carbohydrate?.toLowerCase();
      const veggie = recipe.primary_vegetable?.toLowerCase();

      // Check for conflicts with already selected recipes
      let hasConflict = false;
      
      if (protein && usedProteins.has(protein)) hasConflict = true;
      if (carb && usedCarbs.has(carb)) hasConflict = true;
      if (veggie && usedVeggies.has(veggie)) hasConflict = true;

      // If no conflict or we need to fill remaining slots, add it
      if (!hasConflict || selected.length < Math.min(count, scoredRecipes.length)) {
        selected.push(suggestion);
        
        if (protein) usedProteins.add(protein);
        if (carb) usedCarbs.add(carb);
        if (veggie) usedVeggies.add(veggie);
      }
    }

    return selected;
  }

  /**
   * Get a human-readable reason for why this recipe was suggested
   */
  private static getRecipeReason(recipe: Recipe): string {
    if (!recipe.last_ordered_at) {
      return "You haven't tried this recipe yet!";
    }

    const daysSince = this.getDaysSince(new Date(recipe.last_ordered_at));
    
    if (daysSince > 60) return "You haven't made this in a while";
    if (daysSince > 30) return "Haven't had this in over a month";
    if (daysSince > 14) return "It's been a couple weeks";
    if (recipe.total_orders <= 2) return "One of your newer recipes";
    
    return "A reliable favorite";
  }

  /**
   * Calculate days between date and now
   */
  private static getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const recipeSuggestionService = RecipeSuggestionService;
