import OpenAI from 'openai';
import type { ParsedQuery } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseNaturalLanguageQuery(query: string): Promise<ParsedQuery> {
  const systemPrompt = `You are a query parser for freight quote searches.
Extract search parameters, filters, and aggregation requirements from natural language.

Return a JSON object with these exact fields:
{
  "searchText": "main keywords for vector search",
  "filters": {
    "customerName": "customer name if mentioned",
    "originPort": "origin port if mentioned", 
    "destinationPort": "destination port if mentioned",
    "minAmount": numeric value or null,
    "maxAmount": numeric value or null,
    "dateFrom": "YYYY-MM-DD format or null",
    "dateTo": "YYYY-MM-DD format or null",
    "shipmentMode": "sea/air/road if mentioned",
    "containerType": "container type if mentioned",
    "supplierName": "supplier name if mentioned"
  },
  "aggregation": {
    "type": "sum/avg/count/min/max or null",
    "groupBy": ["field names to group by"],
    "field": "field to aggregate"
  },
  "sort": {
    "field": "field to sort by",
    "direction": "asc or desc"
  },
  "limit": number or 50
}

Examples:
"quotes to Chicago over $10,000" -> 
{
  "searchText": "Chicago",
  "filters": {"destinationPort": "Chicago", "minAmount": 10000}
}

"Show me all quotes to Chinese ports" ->
{
  "searchText": "China Shanghai Tianjin Qingdao Ningbo",
  "filters": {"destinationPort": "China"}
}

"total shipping costs for Aier Environmental" ->
{
  "searchText": "Aier Environmental",
  "filters": {"customerName": "Aier Environmental"},
  "aggregation": {"type": "sum", "field": "total_amount", "groupBy": ["customerName"]}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    
    // Clean up and validate the response
    return {
      searchText: parsed.searchText || '',
      filters: {
        customerName: parsed.filters?.customerName || undefined,
        originPort: parsed.filters?.originPort || undefined,
        destinationPort: parsed.filters?.destinationPort || undefined,
        minAmount: parsed.filters?.minAmount || undefined,
        maxAmount: parsed.filters?.maxAmount || undefined,
        dateFrom: parsed.filters?.dateFrom || undefined,
        dateTo: parsed.filters?.dateTo || undefined,
        shipmentMode: parsed.filters?.shipmentMode || undefined,
        containerType: parsed.filters?.containerType || undefined,
        supplierName: parsed.filters?.supplierName || undefined,
      },
      aggregation: parsed.aggregation || undefined,
      sort: parsed.sort || undefined,
      limit: parsed.limit || 50
    };
  } catch (error) {
    console.error('Query parsing error:', error);
    // Fallback to simple text search
    return {
      searchText: query,
      filters: {},
      limit: 50
    };
  }
}

// Backwards compatibility
export const parseNaturalQuery = parseNaturalLanguageQuery;