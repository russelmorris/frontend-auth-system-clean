import { NextResponse } from 'next/server';
import { testConnection, searchQuotes } from '@/lib/weaviate/server-client';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to connect to Weaviate' 
      }, { status: 500 });
    }
    
    // Try a simple search
    const testResults = await searchQuotes('freight', 5);
    
    return NextResponse.json({ 
      success: true,
      message: 'Weaviate connection successful',
      sampleResults: testResults.length,
      data: testResults
    });
  } catch (error) {
    console.error('Test Weaviate error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}