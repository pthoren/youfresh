'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Recipe } from '@/lib/types';
import RecipeImage from '@/components/RecipeImage';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

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
              <h1 className="text-2xl font-bold text-gray-900">YouFresh</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => router.push('/')}
              className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 text-sm font-medium"
            >
              Home
            </button>
            <button
              onClick={() => router.push('/recipes')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Recipes
            </button>
            <button
              onClick={() => router.push('/suggestions')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Meal Plan
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Actions - Prominent placement */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Get Started
            </h2>
            <p className="text-gray-600 mb-6">
              Your meal planning and grocery shopping assistant. Add recipes, plan meals for the week, and generate shopping lists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/recipes/new')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium text-center transition-colors"
              >
                ➕ Add New Recipe
              </button>
              
              {recipes.length >= 1 && (
                <button
                  onClick={() => router.push('/suggestions')}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium text-center transition-colors"
                >
                  📋 Plan Your Meals
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Recipes Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              
              {recipes.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to get started?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You don't have any recipes yet. Use the "Add New Recipe" button above to create your first recipe!
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Recent Recipes ({recipes.length})
                  </h3>
                  <div className="space-y-3">
                    {recipes.slice(0, 5).map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Recipe Image */}
                        <div className="flex-shrink-0">
                          <RecipeImage 
                            recipe={recipe} 
                            className="w-16 h-16 rounded-lg"
                          />
                        </div>
                        
                        {/* Recipe Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{recipe.name}</h4>
                          <p className="text-sm text-gray-700">
                            {recipe.total_orders > 0 
                              ? `Ordered ${recipe.total_orders} times`
                              : 'Never ordered'
                            }
                          </p>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/recipes')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View all recipes →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Actions & Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">More Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/recipes')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-left"
                >
                  📋 View All Recipes
                </button>
              </div>
            </div>

            {recipes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Recipes:</span>
                    <span className="font-medium text-gray-900">{recipes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Most Ordered:</span>
                    <span className="font-medium text-gray-900">
                      {recipes.length > 0 
                        ? (() => {
                            const mostOrdered = recipes.reduce((prev, current) => 
                              prev.total_orders > current.total_orders ? prev : current
                            );
                            return mostOrdered.total_orders > 0 
                              ? mostOrdered.name 
                              : 'None ordered yet';
                          })()
                        : 'None'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
