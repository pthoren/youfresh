'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RecipeSuggestion } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function Suggestions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRecipes, setTotalRecipes] = useState(0);

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
    fetchSuggestions();
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Here are 3 recipe suggestions for you!
              </h2>
              <p className="text-gray-600">
                Based on your {totalRecipes} recipes, recipe history, and variety preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.recipe.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      Suggestion #{index + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      Score: {Math.round(suggestion.score)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {suggestion.recipe.name}
                  </h3>

                  <p className="text-sm text-green-600 mb-4 italic">
                    {suggestion.reason}
                  </p>

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

                  {/* Ingredients Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {suggestion.recipe.raw_ingredients}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/recipes/${suggestion.recipe.id}/edit`)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200"
                    >
                      View Recipe
                    </button>
                    <button
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                      onClick={() => {
                        // TODO: Add to meal plan functionality
                        alert('Add to meal plan feature coming soon!');
                      }}
                    >
                      Add to Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
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
        )}
      </main>
    </div>
  );
}
