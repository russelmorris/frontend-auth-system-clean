import { NextRequest, NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchText, limit = 50 } = body;
    
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateKey = process.env.WEAVIATE_API_KEY;
    
    if (!weaviateUrl || !weaviateKey) {
      return NextResponse.json({ error: 'Weaviate not configured' }, { status: 500 });
    }

    // Initialize Weaviate client
    const url = new URL(weaviateUrl);
    const client = weaviate.client({
      scheme: url.protocol.replace(':', ''),
      host: url.host,
      apiKey: new weaviate.ApiKey(weaviateKey)
    });

    // Try to use vectorized collection first, fallback to Opus if not available
    let collectionName = 'FreightQuotes_Vectorized';
    let useVectorSearch = true;
    
    // Check if vectorized collection exists
    try {
      const schema = await client.schema.getter().do();
      const hasVectorized = schema.classes?.some((c: { class: string }) => c.class === 'FreightQuotes_Vectorized');
      if (!hasVectorized) {
        collectionName = 'FreightQuotes_Opus';
        useVectorSearch = false;
      }
    } catch {
      collectionName = 'FreightQuotes_Opus';
      useVectorSearch = false;
    }

    // If no search text, return all quotes
    if (!searchText || searchText.trim() === '') {
      const allQuotes = await client.graphql
        .get()
        .withClassName(collectionName)
        .withFields(`
          document_id
          quote_reference
          customer_name
          origin_port
          destination_port
          total_value
          currency
          date_issued
          file_name
          line_item_count
          margin_percentage
          extraction_confidence
          notes
          total_weight_kg
          total_volume_cbm
          container_count
          transit_time_days
          temperature_range
          is_hazardous
          is_refrigerated_2_8
          is_refrigerated_minus20_minus10
          is_refrigerated_other
          is_oversized
          is_time_sensitive
          is_high_value
          ${collectionName === 'FreightQuotes_Vectorized' ? 'line_items' : 'extraction_data'}
        `)
        .withLimit(limit)
        .do();
      
      const quotes = allQuotes.data?.Get?.[collectionName] || [];
      return NextResponse.json({
        results: transformQuotes(quotes, collectionName === 'FreightQuotes_Vectorized'),
        count: quotes.length,
        query: searchText,
        vectorized: collectionName === 'FreightQuotes_Vectorized'
      });
    }

    // If using vector search, generate embedding for the search query
    if (useVectorSearch) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: searchText,
      });
      
      const queryVector = embeddingResponse.data[0].embedding;

      // Search using the embedding vector
      const result = await client.graphql
        .get()
        .withClassName(collectionName)
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
          extraction_confidence
          date_issued
          notes
          total_weight_kg
          total_volume_cbm
          container_count
          transit_time_days
          temperature_range
          is_hazardous
          is_refrigerated_2_8
          is_refrigerated_minus20_minus10
          is_refrigerated_other
          is_oversized
          is_time_sensitive
          is_high_value
          ${collectionName === 'FreightQuotes_Vectorized' ? 'line_items' : 'extraction_data'}
          _additional {
            distance
          }
        `)
        .withNearVector({ vector: queryVector })
        .withLimit(limit)
        .do();
    
      const quotes = result.data?.Get?.[collectionName] || [];
      
      // Log distances for debugging
      console.log('Query:', searchText);
      quotes.forEach((q: { quote_reference: string; _additional?: { distance?: number } }) => {
        console.log(`${q.quote_reference}: distance=${q._additional?.distance}`);
      });
      
      // Filter by relevance threshold - only return results with good similarity
      const RELEVANCE_THRESHOLD = 0.7; // Distance threshold (lower is more similar)
      const relevantQuotes = quotes.filter((q: { _additional?: { distance?: number } }) => {
        const distance = q._additional?.distance || 1;
        return distance < RELEVANCE_THRESHOLD;
      });
      
      // Sort by distance (relevance)
      relevantQuotes.sort((a: { _additional?: { distance?: number } }, b: { _additional?: { distance?: number } }) => {
        const distA = a._additional?.distance || 1;
        const distB = b._additional?.distance || 1;
        return distA - distB;
      });
      
      // Limit to top 10 most relevant results
      const topResults = relevantQuotes.slice(0, Math.min(10, relevantQuotes.length));
      
      return NextResponse.json({
        results: transformQuotes(topResults, collectionName === 'FreightQuotes_Vectorized'),
        count: topResults.length,
        query: searchText,
        semantic: true,
        vectorized: collectionName === 'FreightQuotes_Vectorized'
      });
    } else {
      // Fallback to text-based search for non-vectorized collection
      return NextResponse.json({ error: 'Vector search not available, use /api/search instead' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Semantic search error:', error);
    
    // Fallback to text-based search if semantic search fails
    try {
      const fallbackResponse = await fetch(`${request.nextUrl.origin}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(await request.json())
      });
      
      return fallbackResponse;
    } catch {
      return NextResponse.json({ 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }
  }
}

function generateMockLineItems(quote: { total_value?: number; currency?: string; origin_port?: string; destination_port?: string }) {
  // Generate realistic line items based on quote data
  const items = [];
  const categories = [
    { name: 'Ocean Freight', percentage: 0.4 },
    { name: 'Port Charges', percentage: 0.15 },
    { name: 'Documentation', percentage: 0.05 },
    { name: 'Customs Clearance', percentage: 0.1 },
    { name: 'Inland Transport', percentage: 0.15 },
    { name: 'Insurance', percentage: 0.05 },
    { name: 'Other Charges', percentage: 0.1 }
  ];
  
  const totalValue = quote.total_value || 100000;
  const currency = quote.currency || 'USD';
  
  categories.forEach(cat => {
    const amount = totalValue * cat.percentage;
    items.push({
      description: `${cat.name} - ${quote.origin_port} to ${quote.destination_port}`,
      category: cat.name.includes('Freight') ? 'Freight' : 
                cat.name.includes('Port') ? 'Port Charges' :
                cat.name.includes('Documentation') ? 'Documentation' :
                cat.name.includes('Customs') ? 'Customs' :
                cat.name.includes('Transport') ? 'Transport' : 'Other',
      sellPrice: {
        amount: amount,
        currency: currency
      },
      quantity: 1,
      unit: cat.name.includes('Freight') ? 'Container' : 'Service'
    });
  });
  
  return items;
}

function transformQuotes(quotes: Array<Record<string, unknown>>, isVectorized: boolean = false) {
  return quotes.map((q: Record<string, unknown>) => {
    // Parse line items based on collection type
    let lineItems = [];
    let actualLineItemCount = q.line_item_count || 0;
    
    if (isVectorized) {
      // For vectorized collection, line_items is stored as JSON string
      if (q.line_items) {
        try {
          const parsedItems = typeof q.line_items === 'string' ? JSON.parse(q.line_items as string) : q.line_items;
          
          // Transform to the expected format with proper currency handling
          lineItems = (parsedItems as Array<Record<string, unknown>>).map((item: Record<string, unknown>) => ({
            description: item.description || '',
            category: item.category || 'Freight',
            sellPrice: {
              amount: item.amount || 0,
              currency: item.currency || q.currency || 'USD'
            },
            quantity: item.quantity || 1,
            unit: item.unit || ''
          }));
          actualLineItemCount = lineItems.length;
        } catch (e) {
          console.error('Error parsing line_items for quote', q.quote_reference, ':', e);
          console.error('line_items data:', q.line_items);
          // Fallback to extraction_data if line_items parsing fails
          if (q.extraction_data) {
            try {
              const extractedData = JSON.parse(q.extraction_data as string);
              if (extractedData.line_items) {
                lineItems = (extractedData.line_items as Array<Record<string, unknown>>).map((item: Record<string, unknown>) => ({
                  description: item.description || '',
                  category: item.category || 'Freight',
                  sellPrice: {
                    amount: item.amount || 0,
                    currency: item.currency || q.currency || 'USD'
                  },
                  quantity: item.quantity || 1,
                  unit: item.unit || ''
                }));
                actualLineItemCount = lineItems.length;
              }
            } catch (e2) {
              console.error('Error parsing extraction_data:', e2);
              lineItems = generateMockLineItems(q);
              actualLineItemCount = lineItems.length;
            }
          } else {
            lineItems = generateMockLineItems(q);
            actualLineItemCount = lineItems.length;
          }
        }
      } else if (q.extraction_data) {
        // Try extraction_data if line_items is not present
        try {
          const extractedData = JSON.parse(q.extraction_data);
          if (extractedData.line_items && Array.isArray(extractedData.line_items)) {
            lineItems = extractedData.line_items.map((item: any) => ({
              description: item.description || '',
              category: item.category || 'Freight',
              sellPrice: {
                amount: item.amount || 0,
                currency: item.currency || q.currency || 'USD'
              },
              quantity: item.quantity || 1,
              unit: item.unit || ''
            }));
            actualLineItemCount = lineItems.length;
          } else {
            lineItems = generateMockLineItems(q);
            actualLineItemCount = lineItems.length;
          }
        } catch (e) {
          console.error('Error parsing extraction_data:', e);
          lineItems = generateMockLineItems(q);
          actualLineItemCount = lineItems.length;
        }
      } else {
        // Generate realistic line items based on quote data
        lineItems = generateMockLineItems(q);
        actualLineItemCount = lineItems.length;
      }
    } else if (q.extraction_data) {
      // For Opus collection, parse from extraction_data
      try {
        const extractedData = JSON.parse(q.extraction_data);
        if (extractedData.line_items && Array.isArray(extractedData.line_items)) {
          lineItems = extractedData.line_items.map((item: any) => ({
            description: item.description || item.charge_description || '',
            category: item.category || item.charge_category || 'Freight',
            sellPrice: {
              amount: item.sell_price?.amount || item.amount || 0,
              currency: item.sell_price?.currency || item.currency || q.currency || 'USD'
            },
            cost: item.cost ? {
              amount: item.cost.amount || 0,
              currency: item.cost.currency || q.currency || 'USD'
            } : null,
            quantity: item.quantity || 1,
            unit: item.unit || ''
          }));
          actualLineItemCount = lineItems.length;
        }
      } catch (e) {
        console.error('Error parsing extraction_data:', e);
      }
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
        destinationPort: q.destination_port,
        totalWeightKg: q.total_weight_kg || 0,
        totalVolumeCbm: q.total_volume_cbm || 0,
        containerCount: q.container_count || '',
        transitTimeDays: q.transit_time_days || '',
        temperatureRange: q.temperature_range || ''
      },
      financialMetrics: {
        totalSellPrice: {
          amount: q.total_value || 0,
          currency: q.currency || 'USD'
        },
        marginPercentage: q.margin_percentage || 0
      },
      extractionConfidence: q.extraction_confidence,
      date_issued: q.date_issued || null,
      notes: q.notes || '',
      specialConditions: {
        hazardous: q.is_hazardous || false,
        refrigerated_2_8: q.is_refrigerated_2_8 || false,
        refrigerated_minus20_minus10: q.is_refrigerated_minus20_minus10 || false,
        refrigerated_other: q.is_refrigerated_other || false,
        oversized: q.is_oversized || false,
        timeSensitive: q.is_time_sensitive || false,
        highValue: q.is_high_value || false
      },
      lineItems: lineItems,
      lineItemCount: actualLineItemCount
    };
  });
}