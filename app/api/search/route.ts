import { NextRequest, NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchText, limit = 50 } = body;
    
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateKey = process.env.WEAVIATE_API_KEY;
    
    if (!weaviateUrl || !weaviateKey) {
      return NextResponse.json({ error: 'Weaviate not configured' }, { status: 500 });
    }

    const url = new URL(weaviateUrl);
    const client = weaviate.client({
      scheme: url.protocol.replace(':', ''),
      host: url.host,
      apiKey: new weaviate.ApiKey(weaviateKey)
    });

    let whereClause = null;
    
    // If there's search text, create a filter
    if (searchText && searchText.trim()) {
      const lowerSearch = searchText.toLowerCase().trim();
      
      // Special keywords that should show all results
      if (lowerSearch === 'all' || 
          lowerSearch === 'recent' || 
          lowerSearch === 'show all' || 
          lowerSearch === 'most recent' ||
          lowerSearch.includes('all quotes') ||
          lowerSearch.includes('all freight') ||
          lowerSearch === 'show all quotes') {
        // Don't filter - show all quotes
        whereClause = null;
      } else {
        // Check for specific keywords in natural language queries
        // const searchTerms = lowerSearch.split(' ');
        let searchTarget = searchText;
        
        // Handle natural language queries about China/Chinese
        if (lowerSearch.includes('chinese') || lowerSearch.includes('china')) {
          searchTarget = 'China';
        }
        // Handle queries about line items
        else if (lowerSearch.includes('line item')) {
          // For line items queries, just show all for now
          whereClause = null;
          searchTarget = null;
        }
        
        // If we have a search target, create filters
        if (searchTarget) {
          whereClause = {
            operator: 'Or',
            operands: [
              {
                path: ['customer_name'],
                operator: 'Like',
                valueText: `*${searchTarget}*`
              },
              {
                path: ['quote_reference'],
                operator: 'Like',
                valueText: `*${searchTarget}*`
              },
              {
                path: ['origin_port'],
                operator: 'Like',
                valueText: `*${searchTarget}*`
              },
              {
                path: ['destination_port'],
                operator: 'Like',
                valueText: `*${searchTarget}*`
              }
            ]
          };
        }
      }
    }

    // Build the query
    let query = client.graphql
      .get()
      .withClassName('FreightQuotes_Opus')
      .withFields(`
        document_id
        quote_reference
        customer_name
        origin_port
        destination_port
        total_value
        currency
        file_name
        line_item_count
        margin_percentage
        model_used
        extraction_confidence
      `)
      .withLimit(limit);
    
    // Add where clause if we have search text
    if (whereClause) {
      query = query.withWhere(whereClause);
    }
    
    const result = await query.do();
    const quotes = result.data?.Get?.FreightQuotes_Opus || [];
    
    // Transform to expected format
    const transformedQuotes = quotes.map((q: Record<string, unknown>) => {
      // For now, create empty line items array with the count we have
      // The actual line items are in extraction_data but too complex to query directly
      const lineItemCount = q.line_item_count || 0;
      const lineItems = [];
      
      // Add a placeholder to show the count in the UI
      for (let i = 0; i < Math.min(lineItemCount, 3); i++) {
        lineItems.push({
          description: `Line item ${i + 1} of ${lineItemCount}`,
          category: 'Freight',
          sellPrice: { amount: 0, currency: q.currency || 'USD' }
        });
      }
      
      return {
        id: q.document_id,
        documentId: q.document_id,
        fileName: q.file_name,
        quoteReference: q.quote_reference,
        customer: {
          name: q.customer_name
        },
        shipment: {
          originPort: q.origin_port,
          destinationPort: q.destination_port
        },
        financialMetrics: {
          totalSellPrice: {
            amount: q.total_value || 0,
            currency: q.currency || 'USD'
          },
          marginPercentage: q.margin_percentage || 0
        },
        extractionConfidence: q.extraction_confidence,
        lineItems: lineItems,
        lineItemCount: lineItemCount  // Add the actual count
      };
    });
    
    return NextResponse.json({
      results: transformedQuotes,
      count: transformedQuotes.length,
      query: searchText
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}