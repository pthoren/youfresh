import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import db from '@/lib/db';
import { openaiService } from '@/lib/openai';

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

    // Get user's recipes
    const recipes = await db('recipes')
      .where({ user_id: user.id })
      .orderBy('created_at', 'desc');

    // Parse JSON fields back to objects
    const formattedRecipes = recipes.map(recipe => {
      let parsedIngredients = null;
      if (recipe.parsed_ingredients) {
        try {
          parsedIngredients = typeof recipe.parsed_ingredients === 'string' 
            ? JSON.parse(recipe.parsed_ingredients) 
            : recipe.parsed_ingredients;
        } catch (error) {
          console.error('Error parsing ingredients for recipe:', recipe.name, error);
        }
      }
      
      return {
        ...recipe,
        parsed_ingredients: parsedIngredients,
      };
    });

    return NextResponse.json(formattedRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { name, raw_ingredients } = await request.json();

    if (!name || !raw_ingredients) {
      return NextResponse.json({ error: 'Name and ingredients are required' }, { status: 400 });
    }

    // Parse ingredients using AI
    let parsedData = null;
    
    try {
      parsedData = await openaiService.parseIngredients(raw_ingredients);
    } catch (error) {
      console.error('Failed to parse ingredients with AI:', error);
      // Continue without AI parsing - we'll store the raw ingredients
    }

    // Create recipe first (without image)
    const [recipe] = await db('recipes')
      .insert({
        user_id: user.id,
        name,
        raw_ingredients,
        parsed_ingredients: parsedData ? JSON.stringify(parsedData) : null,
        primary_protein: parsedData?.primary_protein || null,
        primary_carbohydrate: parsedData?.primary_carbohydrate || null,
        primary_vegetable: parsedData?.primary_vegetable || null,
        total_orders: 0,
      })
      .returning('*');

    // Trigger asynchronous image generation (don't wait for it)
    if (recipe?.id) {
      // Fire-and-forget image generation
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recipes/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '', // Forward session
        },
        body: JSON.stringify({ recipeId: recipe.id }),
      }).catch(error => {
        console.error('Background image generation failed:', error);
        // Fail silently - image generation is not critical
      });
    }

    // Add parsing status to response
    const response = {
      ...recipe,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
