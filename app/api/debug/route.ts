import { NextResponse } from 'next/server';

export async function GET() {
  // Make a test search request to our own API
  const response = await fetch('http://localhost:3003/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchText: 'all',
      limit: 10
    })
  });

  const data = await response.json();
  
  return NextResponse.json({
    apiWorking: response.ok,
    resultCount: data.results?.length || 0,
    firstResult: data.results?.[0] || null,
    rawResponse: data
  });
}