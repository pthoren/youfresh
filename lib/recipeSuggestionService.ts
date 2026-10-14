import { Recipe, RecipeSuggestion } from '@/lib/types';

// How often each recipe appeared in past weekly meal plans
export type MealPlanHistory = Map<string, { lastPlannedAt: Date; timesPlanned: number }>;

// Score penalty for each main ingredient a recipe shares with meals already picked
const SHARED_INGREDIENT_PENALTY = 40;

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
      history?: MealPlanHistory;
    } = {}
  ): RecipeSuggestion[] {
    if (allRecipes.length === 0) return [];
    
    const { excludeRecipeIds = [], strategy = 'balanced', randomSeed, history } = options;
    
    // Special handling for single recipe - allow multiple suggestions of the same recipe
    if (allRecipes.length === 1) {
      const recipe = allRecipes[0];
      return Array(count).fill(null).map((_, index) => ({
        recipe,
        score: 100 + (Math.random() * 20),
        reason: this.getSingleRecipeReason(recipe, index)
      }));
    }
    
    // Adjust count based on available recipes for better experience
    const effectiveCount = Math.min(count, allRecipes.length);
    
    // Filter out excluded recipes
    const availableRecipes = allRecipes.filter(recipe => 
      !excludeRecipeIds.includes(recipe.id)
    );
    
    if (availableRecipes.length === 0) {
      // If all recipes are excluded, fall back to all recipes with random selection
      return this.getRandomRecipes(allRecipes, effectiveCount);
    }

    // Score each recipe based on strategy, counting planned weeks as times it was made
    const scoredRecipes = availableRecipes.map(recipe => {
      const withHistory = this.applyMealPlanHistory(recipe, history);
      return {
        recipe,
        score: this.calculateRecipeScore(withHistory, strategy, randomSeed),
        reason: this.getRecipeReason(withHistory, strategy)
      };
    });

    // Pick the best-scoring recipes while avoiding repeated main ingredients
    const diverseRecipes = this.applyDiversityFilter(scoredRecipes, effectiveCount);

    // Not enough unexcluded recipes left - top up from the excluded ones
    if (diverseRecipes.length < effectiveCount) {
      const excludedRecipes = allRecipes.filter(recipe => excludeRecipeIds.includes(recipe.id));
      diverseRecipes.push(...this.getRandomRecipes(excludedRecipes, effectiveCount - diverseRecipes.length));
    }

    return diverseRecipes;
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
   * Treat recipes from past weekly meal plans as made on the day they were planned.
   * Only used for scoring; the recipe's own order stats are left unchanged.
   */
  private static applyMealPlanHistory(recipe: Recipe, history?: MealPlanHistory): Recipe {
    const planned = history?.get(recipe.id);
    if (!planned) return recipe;

    const lastOrdered = recipe.last_ordered_at ? new Date(recipe.last_ordered_at) : null;
    return {
      ...recipe,
      last_ordered_at: lastOrdered && lastOrdered > planned.lastPlannedAt ? lastOrdered : planned.lastPlannedAt,
      total_orders: recipe.total_orders + planned.timesPlanned,
    };
  }

  /**
   * Pick recipes one at a time, penalizing any that share a primary protein,
   * carbohydrate, or vegetable with recipes already picked. Repeats are only
   * chosen when nothing else scores higher after the penalty.
   */
  private static applyDiversityFilter(scoredRecipes: RecipeSuggestion[], count: number): RecipeSuggestion[] {
    const remaining = [...scoredRecipes];
    const selected: RecipeSuggestion[] = [];
    const usedIngredients = new Set<string>();

    const mainIngredients = (recipe: Recipe) =>
      [
        ['protein', recipe.primary_protein],
        ['carb', recipe.primary_carbohydrate],
        ['vegetable', recipe.primary_vegetable],
      ]
        .filter(([, name]) => name?.trim())
        .map(([category, name]) => `${category}:${name!.trim().toLowerCase()}`);

    while (selected.length < count && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      remaining.forEach((suggestion, index) => {
        const sharedCount = mainIngredients(suggestion.recipe).filter(ingredient => usedIngredients.has(ingredient)).length;
        const adjustedScore = suggestion.score - sharedCount * SHARED_INGREDIENT_PENALTY;
        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestIndex = index;
        }
      });

      const [best] = remaining.splice(bestIndex, 1);
      selected.push(best);
      mainIngredients(best.recipe).forEach(ingredient => usedIngredients.add(ingredient));
    }

    return selected;
  }

  /**
   * Get reasons for single recipe suggestions
   */
  private static getSingleRecipeReason(recipe: Recipe, index: number): string {
    const reasons = [
      "Perfect for meal prep this week!",
      "A reliable choice you know you'll enjoy",
      "Great option for your meal planning",
      "This recipe works well for multiple meals",
      "Easy to make in larger batches"
    ];
    
    if (!recipe.last_ordered_at) {
      return "Time to try your new recipe!";
    }
    
    const daysSince = this.getDaysSince(new Date(recipe.last_ordered_at));
    if (daysSince > 14) {
      return "Haven't made this in a while - perfect timing!";
    }
    
    return reasons[index % reasons.length];
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
