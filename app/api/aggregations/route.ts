import { NextRequest, NextResponse } from 'next/server';
import { getAggregations } from '@/lib/weaviate/queries';
import { z } from 'zod';

const aggregationSchema = z.object({
  groupBy: z.enum(['customer', 'route', 'month', 'shipmentMode', 'supplier']),
  metric: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional().default('sum'),
  field: z.string().optional().default('totalAmount'),
  filters: z.object({
    customer: z.string().optional(),
    originPort: z.string().optional(),
    destinationPort: z.string().optional(),
    shipmentMode: z.string().optional(),
    supplier: z.string().optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
  limit: z.number().optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = aggregationSchema.parse(body);
    
    // Start timer for performance monitoring
    const startTime = Date.now();
    
    // Execute aggregation query
    const results = await getAggregations({
      groupBy: validatedData.groupBy,
      metric: validatedData.metric,
      field: validatedData.field,
      filters: validatedData.filters || {},
      limit: validatedData.limit,
    });
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        groupBy: validatedData.groupBy,
        metric: validatedData.metric,
        field: validatedData.field,
        responseTime,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Aggregation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Aggregation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Convert GET params to POST body
  const body = {
    groupBy: searchParams.get('groupBy') || 'customer',
    metric: searchParams.get('metric') || 'sum',
    field: searchParams.get('field') || 'totalAmount',
    limit: parseInt(searchParams.get('limit') || '10'),
  };
  
  // Create a new request with POST method
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  }));
}