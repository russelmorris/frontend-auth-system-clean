"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Loader2 } from 'lucide-react';
import type { FreightQuote } from '@/lib/types';

interface QuoteTableProps {
  data: FreightQuote[];
  isLoading?: boolean;
  onDrillDown?: (quote: FreightQuote) => void;
}

export function QuoteTable({ data, isLoading, onDrillDown }: QuoteTableProps) {
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No quotes found. Try a different search.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote Reference</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((quote) => (
            <TableRow key={quote.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{quote.quoteReference}</TableCell>
              <TableCell>{quote.customer?.name || 'Unknown'}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {quote.shipment?.originPort || 'Unknown'} → {quote.shipment?.destinationPort || 'Unknown'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{quote.shipment?.shipmentMode || 'Unknown'}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(
                  quote.financialMetrics?.totalSellPrice?.amount || 0, 
                  quote.financialMetrics?.totalSellPrice?.currency || 'USD'
                )}
              </TableCell>
              <TableCell>
                {quote.validUntil ? formatDate(new Date(quote.validUntil)) : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDrillDown && onDrillDown(quote)}
                >
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}