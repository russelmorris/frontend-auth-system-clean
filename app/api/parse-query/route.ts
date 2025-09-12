import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/openai/query-parser';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const parsedQuery = await parseNaturalLanguageQuery(query);
    
    return NextResponse.json(parsedQuery);
  } catch (error) {
    console.error('Query parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse query' },
      { status: 500 }
    );
  }
}