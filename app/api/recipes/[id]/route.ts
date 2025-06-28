import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';
import { openaiService } from '@/lib/openai';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await db('users').where({ email: session.user.email }).first();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, raw_ingredients, last_ordered_at } = await request.json();

    // Check if recipe exists and belongs to user
    const existingRecipe = await db('recipes')
      .where({ id: params.id, user_id: user.id })
      .first();

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Update recipe
    const updateData: any = {
      updated_at: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (raw_ingredients !== undefined) {
      updateData.raw_ingredients = raw_ingredients;
      
      // Parse ingredients with AI if raw_ingredients changed
      try {
        const aiResult = await openaiService.parseIngredients(raw_ingredients);
        updateData.parsed_ingredients = JSON.stringify(aiResult.ingredients);
        updateData.primary_protein = aiResult.primary_protein;
        updateData.primary_carbohydrate = aiResult.primary_carbohydrate;
        updateData.primary_vegetable = aiResult.primary_vegetable;
        updateData.ai_parsed = true;
        updateData.ai_validation = JSON.stringify({
          is_valid_meal: aiResult.is_valid_meal,
          parsed_at: new Date(),
        });
      } catch (aiError) {
        console.error('AI parsing failed during recipe update:', aiError);
        // Continue with update even if AI parsing fails
        updateData.ai_parsed = false;
      }
    }
    if (last_ordered_at !== undefined) updateData.last_ordered_at = last_ordered_at;

    const [updatedRecipe] = await db('recipes')
      .where({ id: params.id })
      .update(updateData)
      .returning('*');

    // Parse JSON fields back to objects for response
    const formattedRecipe = {
      ...updatedRecipe,
      parsed_ingredients: updatedRecipe.parsed_ingredients ? JSON.parse(updatedRecipe.parsed_ingredients) : null
    };

    return NextResponse.json(formattedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await db('users').where({ email: session.user.email }).first();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if recipe exists and belongs to user
    const existingRecipe = await db('recipes')
      .where({ id: params.id, user_id: user.id })
      .first();

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Delete recipe
    await db('recipes').where({ id: params.id }).del();

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
