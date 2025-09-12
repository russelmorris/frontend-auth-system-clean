import weaviate, { WeaviateClient } from 'weaviate-ts-client';

let client: WeaviateClient | null = null;

export function getWeaviateClient(): WeaviateClient {
  if (!client) {
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateKey = process.env.WEAVIATE_API_KEY;
    
    if (!weaviateUrl || !weaviateKey) {
      throw new Error('Weaviate credentials not configured');
    }

    // Parse the URL to get scheme and host
    const url = new URL(weaviateUrl);
    
    client = weaviate.client({
      scheme: url.protocol.replace(':', ''),
      host: url.host,
      apiKey: new weaviate.ApiKey(weaviateKey),
      headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '' }
    });
  }
  return client;
}

export async function searchQuotes(query: string, limit: number = 20) {
  try {
    const client = getWeaviateClient();
    
    // Try to search in FreightQuotes_Opus collection
    const result = await client.graphql
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
        line_item_count
        extraction_confidence
        file_name
        margin_percentage
        model_used
        processed_at
        _additional {
          certainty
          distance
        }
      `)
      // FreightQuotes_Opus doesn't have text vectorization, use simple fetch
      .withWhere({
        path: ['customer_name'],
        operator: 'Like',
        valueText: `*${query}*`
      })
      .withLimit(limit)
      .do();
    
    // Transform the results to match our FreightQuote type
    const quotes = result.data?.Get?.FreightQuotes_Opus || [];
    
    return quotes.map((q: any) => {
      // Parse the full_extraction JSON if available
      let extractedData: any = {};
      let financialMetrics: any = {};
      let lineItems: any[] = [];
      
      if (q.full_extraction) {
        try {
          const fullExtraction = JSON.parse(q.full_extraction);
          extractedData = fullExtraction.extracted_data || {};
          financialMetrics = fullExtraction.financialMetrics || {};
          lineItems = extractedData.lineItems || [];
        } catch (e) {
          console.error('Failed to parse full extraction:', e);
        }
      }
      
      return {
        id: q.document_id || Math.random().toString(36),
        documentId: q.document_id,
        fileName: q.file_name || extractedData.fileName || 'Unknown',
        quoteReference: q.quote_reference || 'Unknown',
        dateIssued: q.date_issued || extractedData.dateIssued || new Date().toISOString(),
        validUntil: q.valid_until || extractedData.validUntil,
        customer: {
          name: q.customer_name || extractedData.customer?.name || 'Unknown Customer',
          code: extractedData.customer?.code,
          contact: extractedData.customer?.contact,
          email: extractedData.customer?.email
        },
        supplier: {
          name: q.supplier_name || extractedData.supplier?.name || 'Unknown Supplier',
          code: extractedData.supplier?.code,
          contact: extractedData.supplier?.contact
        },
        shipment: {
          originPort: q.origin_port || extractedData.shipment?.originPort || 'Unknown',
          destinationPort: q.destination_port || extractedData.shipment?.destinationPort || 'Unknown',
          shipmentMode: q.shipment_mode || extractedData.shipment?.shipmentMode || 'Unknown',
          containerType: extractedData.shipment?.containerType,
          transitTime: extractedData.shipment?.transitTime
        },
        lineItems: lineItems.map(item => ({
          lineNumber: item.lineNumber,
          description: item.description,
          category: item.category,
          quantity: item.quantity || 1,
          unit: item.unit || 'unit',
          sellPrice: {
            amount: item.sellPrice?.totalPrice || item.sellPrice?.amount || 0,
            currency: item.sellPrice?.currency || q.currency || 'USD'
          }
        })),
        financialMetrics: {
          totalSellPrice: {
            amount: financialMetrics.totalSellPrice?.amount || q.total_value || 0,
            currency: financialMetrics.totalSellPrice?.currency || q.currency || 'USD'
          },
          totalCost: {
            amount: financialMetrics.totalCost?.amount || 0,
            currency: financialMetrics.totalCost?.currency || q.currency || 'USD'
          },
          totalMargin: {
            amount: financialMetrics.totalMargin?.amount || 0,
            currency: financialMetrics.totalMargin?.currency || q.currency || 'USD'
          },
          marginPercentage: financialMetrics.marginPercentage || 0
        },
        extractionConfidence: q.extraction_confidence,
        processedAt: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Weaviate search error:', error);
    // Return empty array on error instead of throwing
    return [];
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = getWeaviateClient();
    const schema = await client.schema.getter().do();
    console.log('Weaviate connection successful. Available classes:', 
      schema.classes?.map(c => c.class).join(', '));
    return true;
  } catch (error) {
    console.error('Weaviate connection failed:', error);
    return false;
  }
}