import { NextRequest, NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/weaviate/queries';
import { z } from 'zod';

const filterOptionsSchema = z.object({
  fields: z.array(z.enum(['customer', 'originPort', 'destinationPort', 'shipmentMode', 'supplier'])).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fieldsParam = searchParams.get('fields');
    
    let fields: string[] | undefined;
    if (fieldsParam) {
      fields = fieldsParam.split(',');
    }
    
    const validatedParams = filterOptionsSchema.parse({ fields });
    
    // Get filter options from Weaviate
    const filterOptions = await getFilterOptions(validatedParams.fields);
    
    return NextResponse.json({
      success: true,
      data: filterOptions,
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Filter options API error:', error);
    
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
        error: 'Failed to fetch filter options',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST method to get filtered options based on current selections
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get filter options considering current selections
    const filterOptions = await getFilterOptions(undefined, body.currentFilters);
    
    return NextResponse.json({
      success: true,
      data: filterOptions,
      meta: {
        currentFilters: body.currentFilters,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Filter options API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch filter options',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}