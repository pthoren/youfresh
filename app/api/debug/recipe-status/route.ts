import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import db from '@/lib/db';

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

    // Get the most recent recipe
    const recipe = await db('recipes')
      .where({ user_id: user.id })
      .orderBy('created_at', 'desc')
      .first();

    if (!recipe) {
      return NextResponse.json({ error: 'No recipes found' }, { status: 404 });
    }

    // Check if it has an image
    let parsedData = null;
    try {
      parsedData = recipe.parsed_ingredients ? JSON.parse(recipe.parsed_ingredients) : null;
    } catch (error) {
      console.error('Error parsing recipe data:', error);
    }

    return NextResponse.json({
      recipe: {
        id: recipe.id,
        name: recipe.name,
        created_at: recipe.created_at,
        has_parsed_data: !!parsedData,
        has_image: !!(parsedData?.image_filename),
        image_url: parsedData?.image_filename || null,
      },
      blob_token_configured: !!process.env.BLOB_READ_WRITE_TOKEN,
      openai_configured: !!process.env.OPENAI_API_KEY,
    });

  } catch (error) {
    console.error('Error checking recipe status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
