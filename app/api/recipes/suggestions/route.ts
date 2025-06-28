import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';
import { recipeSuggestionService } from '@/lib/recipeSuggestionService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await db('users').where({ email: session.user.email }).first();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '3');

    // Get user's recipes
    const recipes = await db('recipes')
      .where({ user_id: user.id })
      .orderBy('created_at', 'desc');

    // Parse JSON fields back to objects
    const formattedRecipes = recipes.map(recipe => ({
      ...recipe,
      parsed_ingredients: recipe.parsed_ingredients,
      last_ordered_at: recipe.last_ordered_at ? new Date(recipe.last_ordered_at) : null,
      created_at: new Date(recipe.created_at),
      updated_at: new Date(recipe.updated_at)
    }));

    // Get suggestions using the service
    const suggestions = recipeSuggestionService.suggestRecipes(formattedRecipes, count);

    return NextResponse.json({
      suggestions,
      total_recipes: formattedRecipes.length,
      requested_count: count
    });

  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
