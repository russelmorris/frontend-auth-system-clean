import { NextRequest, NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }
    
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

    // Try to get the document with PDF from FreightQuotes_Vectorized first
    try {
      const result = await client.graphql
        .get()
        .withClassName('FreightQuotes_Vectorized')
        .withFields('document_id quote_reference file_name pdf_base64')
        .withWhere({
          path: ['document_id'],
          operator: 'Equal',
          valueText: documentId
        })
        .do();
      
      const quotes = result.data?.Get?.FreightQuotes_Vectorized || [];
      
      if (quotes.length > 0 && quotes[0].pdf_base64) {
        // Return the PDF base64 data
        return NextResponse.json({
          success: true,
          documentId: quotes[0].document_id,
          quoteReference: quotes[0].quote_reference,
          fileName: quotes[0].file_name,
          pdfBase64: quotes[0].pdf_base64
        });
      }
    } catch {
      console.log('FreightQuotes_Vectorized not available or no PDF data');
    }

    // Try FreightQuotes_Opus collection as fallback
    try {
      const result = await client.graphql
        .get()
        .withClassName('FreightQuotes_Opus')
        .withFields('document_id quote_reference file_name pdf_base64')
        .withWhere({
          path: ['document_id'],
          operator: 'Equal',
          valueText: documentId
        })
        .do();
      
      const quotes = result.data?.Get?.FreightQuotes_Opus || [];
      
      if (quotes.length > 0 && quotes[0].pdf_base64) {
        return NextResponse.json({
          success: true,
          documentId: quotes[0].document_id,
          quoteReference: quotes[0].quote_reference,
          fileName: quotes[0].file_name,
          pdfBase64: quotes[0].pdf_base64
        });
      }
    } catch {
      console.log('FreightQuotes_Opus not available or no PDF data');
    }

    // No PDF found
    return NextResponse.json({
      success: false,
      error: 'PDF not found for this document',
      documentId: documentId
    }, { status: 404 });
    
  } catch (error) {
    console.error('PDF retrieval error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}