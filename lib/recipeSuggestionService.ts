import { Recipe, RecipeSuggestion } from '@/lib/types';

export class RecipeSuggestionService {
  
  /**
   * Suggest N recipes for meal planning with diversity and freshness scoring
   */
  static suggestRecipes(
    allRecipes: Recipe[], 
    count: number = 3, 
    options: {
      excludeRecipeIds?: string[];
      strategy?: 'balanced' | 'random' | 'fresh' | 'favorites';
      randomSeed?: number;
    } = {}
  ): RecipeSuggestion[] {
    if (allRecipes.length === 0) return [];
    
    const { excludeRecipeIds = [], strategy = 'balanced', randomSeed } = options;
    
    // Filter out excluded recipes
    const availableRecipes = allRecipes.filter(recipe => 
      !excludeRecipeIds.includes(recipe.id)
    );
    
    if (availableRecipes.length === 0) {
      // If all recipes are excluded, fall back to all recipes with random selection
      return this.getRandomRecipes(allRecipes, count);
    }

    // Score each recipe based on strategy
    const scoredRecipes = availableRecipes.map(recipe => ({
      recipe,
      score: this.calculateRecipeScore(recipe, strategy, randomSeed),
      reason: this.getRecipeReason(recipe, strategy)
    }));

    // Sort by score (higher is better) with some randomization
    scoredRecipes.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      // Add small random factor to break ties and add variety
      const randomFactor = (Math.random() - 0.5) * 10;
      return scoreDiff + randomFactor;
    });

    // Apply diversity filter to avoid similar recipes
    const diverseRecipes = this.applyDiversityFilter(scoredRecipes, count);

    return diverseRecipes.slice(0, count);
  }

  /**
   * Get random recipes as fallback
   */
  private static getRandomRecipes(recipes: Recipe[], count: number): RecipeSuggestion[] {
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(recipe => ({
      recipe,
      score: Math.random() * 100,
      reason: "Random selection for variety!"
    }));
  }

  /**
   * Calculate a score for recipe suggestion priority
   * Higher score = more likely to be suggested
   */
  private static calculateRecipeScore(
    recipe: Recipe, 
    strategy: string = 'balanced', 
    randomSeed?: number
  ): number {
    let score = 100; // Base score

    // Apply strategy-specific scoring
    switch (strategy) {
      case 'random':
        return Math.random() * 200; // Pure randomness
        
      case 'fresh':
        // Prioritize never-ordered or long-ago recipes
        if (!recipe.last_ordered_at) score += 50;
        else {
          const daysSince = this.getDaysSince(new Date(recipe.last_ordered_at));
          score += Math.min(daysSince, 100); // Cap at 100 bonus points
        }
        if (recipe.total_orders === 0) score += 30;
        break;
        
      case 'favorites':
        // Prioritize frequently ordered recipes
        score += recipe.total_orders * 10;
        if (recipe.last_ordered_at) {
          const daysSince = this.getDaysSince(new Date(recipe.last_ordered_at));
          if (daysSince < 30) score += 20; // Recently ordered favorites
        }
        break;
        
      default: // 'balanced'
        // Original balanced algorithm with slight randomization
        break;
    }

    // Original balanced scoring (applies to all strategies except pure random)
    if (strategy !== 'random') {
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
    }

    // Add small random factor for variety (except for pure random strategy)
    if (strategy !== 'random') {
      score += (Math.random() - 0.5) * 20;
    }

    return Math.max(0, score); // Ensure non-negative score
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
  private static getRecipeReason(recipe: Recipe, strategy: string = 'balanced'): string {
    switch (strategy) {
      case 'random':
        return "Random selection for variety!";
        
      case 'fresh':
        if (!recipe.last_ordered_at) {
          return "You haven't tried this recipe yet!";
        }
        return "Time to try something different!";
        
      case 'favorites':
        if (recipe.total_orders > 3) {
          return "One of your proven favorites!";
        }
        return "Building on what you love!";
        
      default: // 'balanced'
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
