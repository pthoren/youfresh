import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { openaiService } from '@/lib/openai';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    // Get user ID
    const user = await db('users').where({ email: session.user.email }).first();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the recipe and verify ownership
    const recipe = await db('recipes')
      .where({ id: recipeId, user_id: user.id })
      .first();

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if image already exists
    let parsedData = null;
    try {
      parsedData = recipe.parsed_ingredients ? recipe.parsed_ingredients : null;
    } catch (error) {
      console.error('Error parsing existing recipe data:', error);
    }

    if (parsedData?.image_filename) {
      return NextResponse.json({ 
        success: true, 
        message: 'Image already exists',
        imageUrl: parsedData.image_filename 
      });
    }

    // Extract ingredients for image generation
    const ingredients = parsedData?.ingredients?.map((ing: any) => ing.name) || 
                       recipe.raw_ingredients.split(',').map((ing: string) => ing.trim());

    // Generate image
    const imageUrl = await openaiService.generateRecipeImage(
      recipe.name, 
      ingredients,
      user.id
    );

    if (imageUrl) {
      // Update the recipe with the image URL
      const updatedParsedData = {
        ...(parsedData || {}),
        image_filename: imageUrl // Store the full blob URL
      };

      await db('recipes')
        .where({ id: recipeId })
        .update({
          parsed_ingredients: JSON.stringify(updatedParsedData),
          updated_at: new Date()
        });

      return NextResponse.json({ 
        success: true, 
        imageUrl,
        message: 'Image generated successfully'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate image' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in background image generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
