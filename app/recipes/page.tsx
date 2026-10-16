'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Recipe, formatRecipeName } from '@/lib/types';
import { Trash2, Edit, Plus, LayoutGrid, List } from 'lucide-react';
import RecipeImage from '@/components/RecipeImage';

const MAX_MEALS = 3;
const VIEW_MODE_KEY = 'recipesViewMode';

export default function Recipes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (localStorage.getItem(VIEW_MODE_KEY) === 'list') {
      setViewMode('list');
    }
  }, []);

  const changeViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchRecipes();
    fetchMealPlan();
  }, [session, status, router]);

  const fetchMealPlan = async () => {
    try {
      const response = await fetch('/api/meal-plan');
      if (response.ok) {
        const data = await response.json();
        const planIds: string[] = data.plan?.recipes?.map((recipe: Recipe) => recipe.id) || [];
        setSelectedIds(planIds);
        setSavedIds(planIds);
      }
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    }
  };

  const toggleMeal = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else if (selectedIds.length < MAX_MEALS) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSaveMealPlan = async () => {
    setSavingPlan(true);
    try {
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds: selectedIds }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save meals for the week');
      }
    } catch (error) {
      alert('Failed to save meals for the week');
    } finally {
      setSavingPlan(false);
    }
  };

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
        setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        alert('Failed to delete recipe');
      }
    } catch (error) {
      alert('Failed to delete recipe');
    } finally {
      setDeleteLoading(null);
    }
  };

  const planChanged =
    selectedIds.length !== savedIds.length ||
    selectedIds.some(id => !savedIds.includes(id));

  const renderMealCheckbox = (recipe: Recipe, className: string) => {
    const isSelected = selectedIds.includes(recipe.id);
    const selectionFull = !isSelected && selectedIds.length >= MAX_MEALS;

    return (
      <label
        className={`flex items-start gap-3 min-w-0 ${className} ${selectionFull ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        title={selectionFull ? `You can choose up to ${MAX_MEALS} meals` : "Include in this week's meals"}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={selectionFull}
          onChange={() => toggleMeal(recipe.id)}
          className="mt-1 w-5 h-5 flex-shrink-0 text-green-600 rounded focus:ring-green-500 disabled:opacity-40"
        />
        <h3 className="font-semibold text-gray-900">
          {formatRecipeName(recipe.name)}
        </h3>
      </label>
    );
  };

  const renderActions = (recipe: Recipe) => (
    <div className="flex space-x-2 flex-shrink-0">
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
  );

  const renderCategories = (recipe: Recipe) => {
    if (!recipe.primary_protein && !recipe.primary_carbohydrate && !recipe.primary_vegetable) {
      return null;
    }

    return (
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
    );
  };

  const filteredRecipes = recipes
    .filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.raw_ingredients.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: 'base', numeric: true })
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
          />
        </div>

        {/* Recipe Count & View Toggle */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <p className="text-gray-700">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
            {recipes.length > 0 && ` · Tick up to ${MAX_MEALS} recipes to choose this week's meals`}
          </p>
          <div className="flex flex-shrink-0 rounded-lg border border-gray-300 bg-white overflow-hidden">
            <button
              onClick={() => changeViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => changeViewMode('list')}
              className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Recipes */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              {searchTerm ? (
                <>
                  <p className="text-gray-700 mb-4">No recipes found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-700 mb-4">You don't have any recipes yet.</p>
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Recipe Image with Loading Animation */}
                <RecipeImage recipe={recipe} />

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    {renderMealCheckbox(recipe, 'flex-1 mr-2 text-lg')}
                    {renderActions(recipe)}
                  </div>

                  <div className="space-y-3">
                    {renderCategories(recipe)}

                    <div className="flex justify-between items-center text-sm text-gray-700">
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
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <RecipeImage recipe={recipe} className="w-14 h-14" />
                </div>

                <div className="flex-1 min-w-0">
                  {renderMealCheckbox(recipe, 'text-base')}
                </div>

                {renderActions(recipe)}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Meal selection bar */}
      {(selectedIds.length > 0 || planChanged) && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">
                {selectedIds.length} of {MAX_MEALS} meals selected
              </span>
              {selectedIds.length > 0 && (
                <span className="ml-2">
                  {selectedIds
                    .map(id => recipes.find(recipe => recipe.id === id)?.name)
                    .filter((name): name is string => Boolean(name))
                    .map(formatRecipeName)
                    .join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm"
                >
                  Deselect All
                </button>
              )}
              {planChanged && (
                <button
                  onClick={() => setSelectedIds(savedIds)}
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleSaveMealPlan}
                disabled={savingPlan || selectedIds.length === 0 || !planChanged}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPlan ? 'Saving...' : "Set as This Week's Meals"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
