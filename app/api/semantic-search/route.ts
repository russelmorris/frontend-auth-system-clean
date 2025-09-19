import { NextRequest, NextResponse } from 'next/server'
import { searchQuotes, getAllQuotes } from '@/lib/weaviate/queries'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchText, limit = 50 } = body

    let quotes;

    if (searchText && searchText.trim()) {
      // Use search with query
      quotes = await searchQuotes({
        query: searchText,
        limit
      })
    } else {
      // Get all quotes
      quotes = await getAllQuotes({
        limit,
        offset: 0
      })
    }

    return NextResponse.json({
      results: quotes,
      success: true
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to search quotes',
        message: error instanceof Error ? error.message : 'Unknown error',
        results: []
      },
      { status: 500 }
    )
  }
}