import { NextRequest, NextResponse } from 'next/server';
import { getQuoteById, getAllQuotes, getQuoteLineItems } from '@/lib/weaviate/queries';
import { z } from 'zod';

const querySchema = z.object({
  id: z.string().optional(),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
  includeLineItems: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      id: searchParams.get('id') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      includeLineItems: searchParams.get('includeLineItems') === 'true',
    };

    const validatedParams = querySchema.parse(params);

    // If ID is provided, get single quote
    if (validatedParams.id) {
      const quote = await getQuoteById(validatedParams.id);
      
      if (!quote) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Quote not found' 
          },
          { status: 404 }
        );
      }

      // Optionally include line items
      let lineItems = null;
      if (validatedParams.includeLineItems) {
        lineItems = await getQuoteLineItems(validatedParams.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          quote,
          lineItems: lineItems || undefined,
        }
      });
    }

    // Otherwise, get all quotes with pagination
    const quotes = await getAllQuotes({
      limit: validatedParams.limit,
      offset: validatedParams.offset,
    });

    return NextResponse.json({
      success: true,
      data: quotes,
      meta: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: quotes.length,
      }
    });

  } catch (error) {
    console.error('Quotes API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch quotes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}