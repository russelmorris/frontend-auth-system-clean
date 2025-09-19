import { NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';

export async function GET() {
  try {
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

    // Simple query without any filters or vector search
    const result = await client.graphql
      .get()
      .withClassName('FreightQuotes_Prefect')
      .withFields(`
        document_id
        quote_reference
        customer_name
        origin_port
        destination_port
        total_value
        currency
        file_name
      `)
      .withLimit(5)
      .do();

    const quotes = result.data?.Get?.FreightQuotes_Prefect || [];
    
    return NextResponse.json({
      success: true,
      count: quotes.length,
      data: quotes
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch data',
      details: error.toString()
    }, { status: 500 });
  }
}