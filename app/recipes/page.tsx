'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Recipe, getImageUrlFromRecipe } from '@/lib/types';
import { Trash2, Edit, Plus } from 'lucide-react';
import RecipeImage from '@/components/RecipeImage';

export default function Recipes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchRecipes();
  }, [session, status, router]);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecipes(recipes.filter(recipe => recipe.id !== id));
      } else {
        alert('Failed to delete recipe');
      }
    } catch (error) {
      alert('Failed to delete recipe');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.raw_ingredients.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-xl font-semibold text-gray-900">My Recipes</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/recipes/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Recipe</span>
              </button>
              {recipes.length >= 1 && (
                <button
                  onClick={() => router.push('/suggestions')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Plan Your Meals</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Recipe Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              {searchTerm ? (
                <>
                  <p className="text-gray-500 mb-4">No recipes found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">You don't have any recipes yet.</p>
                  <button
                    onClick={() => router.push('/recipes/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Your First Recipe
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => {
              return (
                <div key={recipe.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Recipe Image with Loading Animation */}
                  <RecipeImage recipe={recipe} />
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">
                        {recipe.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit recipe"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          disabled={deleteLoading === recipe.id}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="Delete recipe"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(recipe.primary_protein || recipe.primary_carbohydrate || recipe.primary_vegetable) && (
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {recipe.primary_protein && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                🥩 {recipe.primary_protein}
                              </span>
                            )}
                            {recipe.primary_carbohydrate && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                🌾 {recipe.primary_carbohydrate}
                              </span>
                            )}
                            {recipe.primary_vegetable && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                🥬 {recipe.primary_vegetable}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          Ordered {recipe.total_orders} time{recipe.total_orders !== 1 ? 's' : ''}
                        </span>
                        {recipe.last_ordered_at && (
                          <span>
                            Last: {new Date(recipe.last_ordered_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-400">
                        Created: {new Date(recipe.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
