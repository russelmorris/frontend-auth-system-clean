"use client"

import type { FreightQuote, SearchFilters, ParsedQuery } from '@/lib/types';

export async function parseNaturalLanguageQuery(query: string): Promise<ParsedQuery> {
  const response = await fetch('/api/parse-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    throw new Error('Failed to parse query');
  }
  
  return response.json();
}

export async function searchQuotes(
  searchText: string,
  filters?: SearchFilters,
  limit: number = 50
): Promise<FreightQuote[]> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchText, filters, limit })
  });
  
  if (!response.ok) {
    throw new Error('Search failed');
  }
  
  return response.json();
}

export async function getAllQuotes(
  page: number = 1,
  pageSize: number = 50,
  filters?: SearchFilters
): Promise<{ quotes: FreightQuote[], total: number }> {
  const response = await fetch('/api/quotes?' + new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters && { filters: JSON.stringify(filters) })
  }));
  
  if (!response.ok) {
    throw new Error('Failed to fetch quotes');
  }
  
  return response.json();
}

export async function getQuoteById(id: string): Promise<FreightQuote> {
  const response = await fetch(`/api/quotes/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch quote');
  }
  
  return response.json();
}

export async function getQuoteLineItems(quoteId: string) {
  const response = await fetch(`/api/quotes/${quoteId}/line-items`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch line items');
  }
  
  return response.json();
}

export async function getAggregations(filters?: SearchFilters) {
  const response = await fetch('/api/aggregations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters })
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch aggregations');
  }
  
  return response.json();
}

export async function getFilterOptions() {
  const response = await fetch('/api/filters');
  
  if (!response.ok) {
    throw new Error('Failed to fetch filter options');
  }
  
  return response.json();
}