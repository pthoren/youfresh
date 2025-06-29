'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RecipeSuggestion, Ingredient, getImageUrlFromRecipe } from '@/lib/types';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import RecipeImage from '@/components/RecipeImage';

export default function Suggestions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [groceryList, setGroceryList] = useState<Ingredient[]>([]);
  const [showGroceryList, setShowGroceryList] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchSuggestions();
  }, [session, status, router]);

  const fetchSuggestions = async () => {
    const wasRefreshing = refreshing;
    if (!wasRefreshing) setLoading(true);
    
    try {
      const response = await fetch('/api/recipes/suggestions?count=3');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setTotalRecipes(data.total_recipes);
        
        // Select all suggested recipes by default
        const recipeIds: string[] = data.suggestions.map((s: RecipeSuggestion) => s.recipe.id);
        const newSelection = new Set(recipeIds);
        setSelectedRecipes(newSelection);
      } else {
        console.error('Failed to fetch suggestions');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedRecipes(new Set());
    setShowGroceryList(false);
    fetchSuggestions();
  };

  const toggleRecipeSelection = (recipeId: string) => {
    const newSelection = new Set(selectedRecipes);
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId);
    } else {
      newSelection.add(recipeId);
    }
    setSelectedRecipes(newSelection);
  };

  const consolidateIngredients = (ingredients: Ingredient[]): Ingredient[] => {
    const consolidated: { [key: string]: Ingredient } = {};
    
    ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase().trim();
      
      if (consolidated[key]) {
        // Try to combine quantities if units match
        if (consolidated[key].unit === ingredient.unit) {
          const existing = parseFloat(consolidated[key].quantity) || 0;
          const additional = parseFloat(ingredient.quantity) || 0;
          consolidated[key].quantity = (existing + additional).toString();
        } else {
          // Different units, keep separate with a note
          consolidated[key].quantity += ` + ${ingredient.quantity} ${ingredient.unit}`;
        }
      } else {
        consolidated[key] = { ...ingredient };
      }
    });
    
    return Object.values(consolidated).sort((a, b) => a.name.localeCompare(b.name));
  };

  const generateGroceryList = () => {
    const selectedSuggestions = suggestions.filter(s => selectedRecipes.has(s.recipe.id));
    const allIngredients: Ingredient[] = [];
    
    selectedSuggestions.forEach(suggestion => {
      if (suggestion.recipe.parsed_ingredients) {
        try {
          // Handle both parsed object and JSON string formats
          let parsedData;
          if (typeof suggestion.recipe.parsed_ingredients === 'string') {
            parsedData = JSON.parse(suggestion.recipe.parsed_ingredients);
          } else {
            parsedData = suggestion.recipe.parsed_ingredients;
          }
          
          // Check if it has ingredients array
          if (parsedData && parsedData.ingredients && Array.isArray(parsedData.ingredients)) {
            allIngredients.push(...parsedData.ingredients);
          }
        } catch (error) {
          console.error('Error parsing ingredients for recipe:', suggestion.recipe.name, error);
        }
      }
    });
    
    const consolidatedList = consolidateIngredients(allIngredients);
    setGroceryList(consolidatedList);
    setShowGroceryList(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading suggestions...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Recipe Suggestions</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'New Suggestions'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {totalRecipes < 3 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Not Enough Recipes</h2>
            <p className="text-yellow-700 mb-4">
              You need at least 3 recipes to get meaningful suggestions. You currently have {totalRecipes}.
            </p>
            <button
              onClick={() => router.push('/recipes/new')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Add More Recipes
            </button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No Suggestions Available</h2>
            <p className="text-gray-600">
              Unable to generate suggestions at this time. Try refreshing or add more recipes.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => {
                return (
                  <div key={suggestion.recipe.id} className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                    {/* Recipe Image with Loading Animation */}
                    <RecipeImage recipe={suggestion.recipe} className="w-full h-48" />
                    
                    <div className="p-6">
                      {/* Selection Checkbox */}
                      <div className="flex items-center gap-4 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedRecipes.has(suggestion.recipe.id)}
                          onChange={() => toggleRecipeSelection(suggestion.recipe.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <h3 className="text-xl font-semibold text-gray-900 pr-8">
                          {suggestion.recipe.name}
                        </h3>
                      </div>

                  {/* Recipe Categories */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {suggestion.recipe.primary_protein && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          🥩 {suggestion.recipe.primary_protein}
                        </span>
                      )}
                      {suggestion.recipe.primary_carbohydrate && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          🌾 {suggestion.recipe.primary_carbohydrate}
                        </span>
                      )}
                      {suggestion.recipe.primary_vegetable && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          🥬 {suggestion.recipe.primary_vegetable}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recipe Stats */}
                  <div className="text-sm text-gray-500 mb-4 space-y-1">
                    <p>Ordered {suggestion.recipe.total_orders} times</p>
                    {suggestion.recipe.last_ordered_at && (
                      <p>
                        Last made: {new Date(suggestion.recipe.last_ordered_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/recipes/${suggestion.recipe.id}/edit`)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200"
                    >
                      View Recipe
                    </button>
                  </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-4">
              {selectedRecipes.size > 0 && (
                <div className="text-center">
                  <button
                    onClick={generateGroceryList}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 mx-auto"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Generate Grocery List ({selectedRecipes.size} recipes)</span>
                  </button>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Don't like these suggestions?
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {refreshing ? 'Getting New Suggestions...' : 'Get Different Suggestions'}
                </button>
              </div>
            </div>

            {/* Grocery List Modal/Section */}
            {showGroceryList && (
              <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Your Grocery List</h3>
                  <button
                    onClick={() => setShowGroceryList(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {groceryList.length > 0 ? (
                  <div className="space-y-2">
                    {groceryList.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100">
                        <span className="text-gray-600">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        <span className="font-medium">{ingredient.name}</span>

                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No ingredients found in selected recipes.</p>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => {
                      const listText = groceryList
                        .map(item => `${item.quantity} ${item.unit} ${item.name}`)
                        .join('\n');
                      navigator.clipboard.writeText(listText);
                      alert('Grocery list copied to clipboard!');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => {
                      // Future: Save meal plan to database
                      alert('Save meal plan feature coming soon!');
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Save Meal Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
