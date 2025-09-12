import { NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';

export async function GET() {
  try {
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateKey = process.env.WEAVIATE_API_KEY;
    
    if (!weaviateUrl || !weaviateKey) {
      throw new Error('Weaviate credentials not configured');
    }

    const url = new URL(weaviateUrl);
    
    const client = weaviate.client({
      scheme: url.protocol.replace(':', ''),
      host: url.host,
      apiKey: new weaviate.ApiKey(weaviateKey),
      headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '' }
    });
    
    // Get schema to see available classes
    const schema = await client.schema.getter().do();
    
    // Get stats for each class
    const classStats = [];
    for (const cls of schema.classes || []) {
      try {
        const aggregate = await client.graphql
          .aggregate()
          .withClassName(cls.class || '')
          .withFields('meta { count }')
          .do();
        
        classStats.push({
          className: cls.class,
          count: aggregate.data?.Aggregate?.[cls.class || '']?.[0]?.meta?.count || 0,
          properties: cls.properties?.map(p => p.name) || []
        });
      } catch (err) {
        classStats.push({
          className: cls.class,
          count: 0,
          error: 'Could not get count',
          properties: cls.properties?.map(p => p.name) || []
        });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      classes: classStats
    });
  } catch (error) {
    console.error('Schema fetch error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}