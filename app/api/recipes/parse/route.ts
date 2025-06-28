import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { openaiService } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { raw_ingredients } = await request.json();

    if (!raw_ingredients || typeof raw_ingredients !== 'string') {
      return NextResponse.json({ error: 'raw_ingredients is required and must be a string' }, { status: 400 });
    }

    if (raw_ingredients.trim().length === 0) {
      return NextResponse.json({ error: 'raw_ingredients cannot be empty' }, { status: 400 });
    }

    // Parse ingredients using OpenAI
    const parsedData = await openaiService.parseIngredients(raw_ingredients);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error parsing ingredients:', error);
    
    // Return a more specific error message based on the error type
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API error')) {
        return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 503 });
      }
      if (error.message.includes('Invalid JSON')) {
        return NextResponse.json({ error: 'AI parsing failed, please try again' }, { status: 422 });
      }
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to parse ingredients' }, { status: 500 });
  }
}
