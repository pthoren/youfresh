'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Recipe, ParsedRecipeData } from '@/lib/types';

export default function EditRecipe({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeId, setRecipeId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    raw_ingredients: '',
    last_ordered_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState<ParsedRecipeData | null>(null);
  const [showParsed, setShowParsed] = useState(false);

  // Resolve params Promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setRecipeId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !recipeId) return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchRecipe();
  }, [session, status, router, recipeId]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const recipes = await response.json();
        const currentRecipe = recipes.find((r: Recipe) => r.id === recipeId);
        
        if (currentRecipe) {
          setRecipe(currentRecipe);
          setFormData({
            name: currentRecipe.name,
            raw_ingredients: currentRecipe.raw_ingredients,
            last_ordered_at: currentRecipe.last_ordered_at 
              ? new Date(currentRecipe.last_ordered_at).toISOString().split('T')[0]
              : '',
          });
        } else {
          setError('Recipe not found');
        }
      } else {
        setError('Failed to fetch recipe');
      }
    } catch (error) {
      setError('Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleParsePreview = async () => {
    if (!formData.raw_ingredients.trim()) {
      setError('Please enter ingredients first');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const response = await fetch('/api/recipes/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_ingredients: formData.raw_ingredients }),
      });

      if (response.ok) {
        const data = await response.json();
        setParsedData(data);
        setShowParsed(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to parse ingredients');
      }
    } catch (error) {
      setError('Failed to parse ingredients');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');

    try {
      const updateData: any = {
        name: formData.name,
        raw_ingredients: formData.raw_ingredients,
      };

      if (formData.last_ordered_at) {
        updateData.last_ordered_at = new Date(formData.last_ordered_at).toISOString();
      }

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push('/recipes');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update recipe');
      }
    } catch (error) {
      setError('Failed to update recipe');
    } finally {
      setSaveLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error && !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/recipes')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/recipes')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Edit Recipe</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                placeholder="Enter recipe name..."
              />
            </div>

            <div>
              <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients *
              </label>
              <textarea
                id="ingredients"
                required
                rows={8}
                value={formData.raw_ingredients}
                onChange={(e) => {
                  setFormData({ ...formData, raw_ingredients: e.target.value });
                  // Reset parsed data when raw ingredients change
                  if (parsedData) {
                    setParsedData(null);
                    setShowParsed(false);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                placeholder="Enter ingredients..."
              />
              <div className="mt-3 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Update ingredients to see new AI parsing results.
                </p>
                <button
                  type="button"
                  onClick={handleParsePreview}
                  disabled={parsing || !formData.raw_ingredients.trim()}
                  className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {parsing ? 'Parsing...' : 'Preview AI Parsing'}
                </button>
              </div>
            </div>

            {/* AI Parsing Results */}
            {showParsed && parsedData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium text-green-800">AI Parsing Results</h3>
                  <button
                    type="button"
                    onClick={() => setShowParsed(false)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✕
                  </button>
                </div>

                {/* Meal Validity */}
                <div className="mb-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    parsedData.is_valid_meal 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {parsedData.is_valid_meal ? '✓ Complete Meal' : '⚠ Incomplete Meal'}
                  </div>
                  {!parsedData.is_valid_meal && (
                    <p className="text-sm text-yellow-700 mt-1">
                      This recipe may be missing a protein, carbohydrate, or vegetable component for a complete meal.
                    </p>
                  )}
                </div>

                {/* Primary Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-1">Primary Protein</h4>
                    <p className="text-sm text-gray-800">
                      {parsedData.primary_protein || 'None identified'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-1">Primary Carbohydrate</h4>
                    <p className="text-sm text-gray-800">
                      {parsedData.primary_carbohydrate || 'None identified'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-1">Primary Vegetable</h4>
                    <p className="text-sm text-gray-800">
                      {parsedData.primary_vegetable || 'None identified'}
                    </p>
                  </div>
                </div>

                {/* Parsed Ingredients */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Parsed Ingredients ({parsedData.ingredients.length})</h4>
                  <div className="bg-white rounded-lg border">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-900">Ingredient</th>
                            <th className="text-left p-3 font-medium text-gray-900">Quantity</th>
                            <th className="text-left p-3 font-medium text-gray-900">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.ingredients.map((ingredient, index) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="p-3 text-gray-900">{ingredient.name}</td>
                              <td className="p-3 text-gray-800">{ingredient.quantity}</td>
                              <td className="p-3 text-gray-800">{ingredient.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-green-700">
                  ✓ The recipe will be updated with this parsed data when you save.
                </div>
              </div>
            )}

            <div>
              <label htmlFor="last_ordered" className="block text-sm font-medium text-gray-700 mb-2">
                Last Ordered Date (Optional)
              </label>
              <input
                type="date"
                id="last_ordered"
                value={formData.last_ordered_at}
                onChange={(e) => setFormData({ ...formData, last_ordered_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="mt-1 text-sm text-gray-700">
                Set when you last made or ordered this recipe
              </p>
            </div>

            {recipe && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recipe Stats</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Total orders: {recipe.total_orders}</p>
                  <p>Created: {new Date(recipe.created_at).toLocaleDateString()}</p>
                  {recipe.last_ordered_at && (
                    <p>Last ordered: {new Date(recipe.last_ordered_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/recipes')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
