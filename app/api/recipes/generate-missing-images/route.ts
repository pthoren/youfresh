import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
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

    // Get all recipes without images
    const recipesWithoutImages = await db('recipes')
      .where({ user_id: user.id })
      .whereRaw(`
        parsed_ingredients IS NULL OR 
        parsed_ingredients::text NOT LIKE '%image_filename%'
      `);

    let generatedCount = 0;
    const results = [];

    // Trigger image generation for each recipe (in batches to avoid overwhelming the API)
    for (const recipe of recipesWithoutImages) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recipes/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ recipeId: recipe.id }),
        });

        if (response.ok) {
          generatedCount++;
          results.push({ recipeId: recipe.id, status: 'success', name: recipe.name });
        } else {
          results.push({ recipeId: recipe.id, status: 'failed', name: recipe.name });
        }
      } catch (error) {
        results.push({ 
          recipeId: recipe.id, 
          status: 'error', 
          name: recipe.name, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: `Triggered image generation for ${generatedCount} recipes`,
      totalRecipes: recipesWithoutImages.length,
      generatedCount,
      results
    });

  } catch (error) {
    console.error('Error in bulk image generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
