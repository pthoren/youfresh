import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import db from '@/lib/db';

const MAX_MEALS = 3;

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return db('users').where({ email: session.user.email }).first();
}

// Get the user's current (most recent) meal plan
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await db('meal_plans')
      .where({ user_id: user.id })
      .orderBy('created_at', 'desc')
      .first();

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    const recipeIds: string[] = plan.recipe_ids || [];
    const recipes = await db('recipes')
      .where({ user_id: user.id })
      .whereIn('id', recipeIds);

    // Keep the plan's order and drop any recipes that have since been deleted
    const orderedRecipes = recipeIds
      .map(id => recipes.find(recipe => recipe.id === id))
      .filter(Boolean);

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        created_at: plan.created_at,
        recipes: orderedRecipes,
      },
    });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Save a new meal plan, which becomes the current one
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeIds } = await request.json();

    if (!Array.isArray(recipeIds) || recipeIds.length === 0 || recipeIds.length > MAX_MEALS) {
      return NextResponse.json({ error: `Choose between 1 and ${MAX_MEALS} recipes` }, { status: 400 });
    }

    const uniqueIds = [...new Set(recipeIds as string[])];

    // Verify every recipe belongs to this user
    const ownedRecipes = await db('recipes')
      .where({ user_id: user.id })
      .whereIn('id', uniqueIds)
      .select('id');

    if (ownedRecipes.length !== uniqueIds.length) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const [plan] = await db('meal_plans')
      .insert({
        user_id: user.id,
        name: `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        recipe_ids: JSON.stringify(uniqueIds),
      })
      .returning('*');

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
