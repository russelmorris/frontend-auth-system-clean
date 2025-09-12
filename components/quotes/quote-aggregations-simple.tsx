"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, TrendingUp, Building } from 'lucide-react';
import type { FreightQuote } from '@/lib/types';

interface QuoteAggregationsProps {
  quotes: FreightQuote[];
}

export function QuoteAggregations({ quotes }: QuoteAggregationsProps) {
  // Calculate simple aggregations
  const totalAmount = quotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const activeQuotes = quotes.filter(q => q.status === 'Active').length;
  const avgCertainty = quotes.reduce((sum, q) => sum + (q.certainty || 0), 0) / quotes.length;
  
  // Get unique customers
  const uniqueCustomers = new Set(quotes.map(q => q.customerName)).size;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            From {quotes.length} quotes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeQuotes}</div>
          <p className="text-xs text-muted-foreground">
            {((activeQuotes / quotes.length) * 100).toFixed(0)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Relevance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(avgCertainty)}</div>
          <p className="text-xs text-muted-foreground">
            Search accuracy
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Unique customers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}