'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Recipe } from '@/lib/types';

export default function EditRecipe({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    raw_ingredients: '',
    last_ordered_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchRecipe();
  }, [session, status, router, params.id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const recipes = await response.json();
        const currentRecipe = recipes.find((r: Recipe) => r.id === params.id);
        
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

      const response = await fetch(`/api/recipes/${params.id}`, {
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                onChange={(e) => setFormData({ ...formData, raw_ingredients: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ingredients..."
              />
            </div>

            <div>
              <label htmlFor="last_ordered" className="block text-sm font-medium text-gray-700 mb-2">
                Last Ordered Date (Optional)
              </label>
              <input
                type="date"
                id="last_ordered"
                value={formData.last_ordered_at}
                onChange={(e) => setFormData({ ...formData, last_ordered_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
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
