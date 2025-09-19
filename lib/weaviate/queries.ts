import { getWeaviateClient } from './client';
import type { FreightQuote, SearchFilters } from '@/lib/types';

export async function searchQuotes(options: {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}): Promise<FreightQuote[]> {
  const { query, filters, limit = 50, offset = 0 } = options;
  const client = await getWeaviateClient();
  
  try {
    // Use FreightQuotes_Prefect collection which has data
    const collection = client.collections.get('FreightQuotes_Prefect');
    
    // Build the query
    let results;
    
    if (query && query.trim()) {
      // No vector search available, use filter instead
      results = await collection.query.fetchObjects({
        where: {
          path: ['customer_name'],
          operator: 'Like',
          valueString: `*${query}*`
        },
        limit,
        returnProperties: [
          'document_id',
          'file_name',
          'quote_reference',
          'customer_name',
          'total_value',
          'currency',
          'origin_port',
          'origin_city',
          'origin_country',
          'destination_port',
          'destination_city',
          'destination_country',
          'line_item_count',
          'extraction_confidence',
          'margin_percentage',
          'extraction_model',
          'extracted_at',
          'date_issued',
          'valid_until'
        ]
      });
    } else {
      // Just fetch objects without vector search
      results = await collection.query.fetchObjects({
        limit,
        returnProperties: [
          'document_id',
          'file_name',
          'quote_reference',
          'customer_name',
          'total_value',
          'currency',
          'origin_port',
          'origin_city',
          'origin_country',
          'destination_port',
          'destination_city',
          'destination_country',
          'line_item_count',
          'extraction_confidence',
          'margin_percentage',
          'extraction_model',
          'extracted_at',
          'date_issued',
          'valid_until'
        ]
      });
    }

    // Transform results to FreightQuote format
    return results.objects.map(obj => transformToFreightQuote(obj));
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search quotes');
  }
}

export async function getQuoteById(id: string): Promise<FreightQuote | null> {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('FreightQuotes_Prefect');
    const result = await collection.query.fetchObjectById(id);
    
    if (!result) return null;
    
    return transformToFreightQuote(result);
  } catch (error) {
    console.error('Get quote error:', error);
    return null;
  }
}

export async function getQuoteLineItems(documentId: string): Promise<any[]> {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('FreightChunks_Prefect');
    
    // Get chunks for this document
    const results = await collection.query.fetchObjects({
      where: {
        path: ['document_id'],
        operator: 'Equal',
        valueString: documentId
      },
      limit: 100
    });
    
    // Extract line items from chunks
    const lineItems: any[] = [];
    
    results.objects.forEach(chunk => {
      const lineItemsArray = chunk.properties.line_items_array;
      if (lineItemsArray) {
        try {
          const items = JSON.parse(lineItemsArray);
          lineItems.push(...items);
        } catch (e) {
          console.error('Failed to parse line items:', e);
        }
      }
    });
    
    return lineItems;
  } catch (error) {
    console.error('Get line items error:', error);
    return [];
  }
}

export async function getAllQuotes(options: { limit: number; offset: number }): Promise<FreightQuote[]> {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('FreightQuotes_Prefect');
    const results = await collection.query.fetchObjects({
      limit: options.limit,
      offset: options.offset,
      returnProperties: [
        'document_id',
        'file_name',
        'quote_reference',
        'customer_name',
        'total_value',
        'currency',
        'origin_port',
        'origin_city',
        'origin_country',
        'destination_port',
        'destination_city',
        'destination_country',
        'date_issued',
        'valid_until',
        'line_item_count',
        'extraction_confidence',
        'margin_percentage',
        'extraction_model',
        'extracted_at'
      ]
    });
    
    return results.objects.map(obj => transformToFreightQuote(obj));
  } catch (error) {
    console.error('Get all quotes error:', error);
    throw new Error('Failed to fetch quotes');
  }
}

export async function getAggregations(options: {
  groupBy: string;
  metric: string;
  field: string;
  filters: SearchFilters;
  limit: number;
}): Promise<any[]> {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('FreightQuotes_Prefect');
    
    // Build aggregation query
    const aggregation = await collection.aggregate.overAll({
      groupBy: [options.groupBy],
      limit: options.limit
    });
    
    return aggregation.groups.map(group => ({
      name: group.groupedBy[options.groupBy],
      count: group.count,
      // Additional metrics would be calculated here
    }));
  } catch (error) {
    console.error('Aggregation error:', error);
    throw new Error('Failed to get aggregations');
  }
}

export async function getFilterOptions(fields?: string[], currentFilters?: SearchFilters): Promise<Record<string, string[]>> {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('FreightQuotes_Prefect');
    const options: Record<string, string[]> = {};
    
    const fieldsToFetch = fields || ['customer_name', 'origin_port', 'destination_port', 'shipment_mode', 'supplier_name'];
    
    for (const field of fieldsToFetch) {
      try {
        const results = await collection.aggregate.overAll({
          groupBy: [field],
          limit: 100
        });
        
        options[field] = results.groups
          .map(g => g.groupedBy[field])
          .filter(v => v != null);
      } catch (e) {
        console.error(`Failed to get options for ${field}:`, e);
        options[field] = [];
      }
    }
    
    return options;
  } catch (error) {
    console.error('Get filter options error:', error);
    return {};
  }
}

// Helper function to transform Weaviate object to FreightQuote
function transformToFreightQuote(obj: any): FreightQuote {
  const props = obj.properties;
  
  // Parse the extraction_data if available
  let extractedData: any = {};
  if (props.extraction_data) {
    extractedData = props.extraction_data;
  }
  
  return {
    id: obj.uuid || props.document_id,
    documentId: props.document_id,
    fileName: props.file_name,
    quoteReference: props.quote_reference,
    dateIssued: props.date_issued || extractedData.dateIssued,
    validUntil: props.valid_until || extractedData.validUntil,
    customer: {
      name: props.customer_name,
      ...extractedData.customer
    },
    supplier: {
      name: props.supplier_name,
      ...extractedData.supplier
    },
    shipment: {
      originPort: props.origin_port,
      destinationPort: props.destination_port,
      shipmentMode: props.shipment_mode,
      ...extractedData.shipment
    },
    lineItems: extractedData.lineItems || [],
    financialMetrics: {
      totalSellPrice: {
        amount: props.total_value || 0,
        currency: props.currency || 'USD'
      },
      totalCost: extractedData.financialMetrics?.totalCost || { amount: 0, currency: props.currency || 'USD' },
      totalMargin: extractedData.financialMetrics?.totalMargin || { amount: 0, currency: props.currency || 'USD' },
      marginPercentage: props.margin_percentage || extractedData.financialMetrics?.marginPercentage || 0,
      ...extractedData.financialMetrics
    },
    extractionConfidence: props.extraction_confidence,
    processedAt: props.extracted_at || props.processed_at,
    modelUsed: props.extraction_model || props.model_used
  };
}