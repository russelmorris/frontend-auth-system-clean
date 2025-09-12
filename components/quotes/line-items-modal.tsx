"use client"

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { FreightQuote } from '@/lib/types';

interface LineItemsModalProps {
  quote: FreightQuote;
  isOpen: boolean;
  onClose: () => void;
}

// Mock line items data
const getMockLineItems = (quoteNumber: string) => [
  {
    id: `${quoteNumber}-L001`,
    description: "Ocean Freight - 40'HC Container",
    category: "Freight",
    quantity: 2,
    unitPrice: 45000,
    total: 90000,
    currency: "USD"
  },
  {
    id: `${quoteNumber}-L002`,
    description: "Port Handling Charges",
    category: "Terminal",
    quantity: 2,
    unitPrice: 1500,
    total: 3000,
    currency: "USD"
  },
  {
    id: `${quoteNumber}-L003`,
    description: "Documentation Fee",
    category: "Documentation",
    quantity: 1,
    unitPrice: 250,
    total: 250,
    currency: "USD"
  },
  {
    id: `${quoteNumber}-L004`,
    description: "Customs Clearance",
    category: "Customs",
    quantity: 1,
    unitPrice: 850,
    total: 850,
    currency: "USD"
  },
  {
    id: `${quoteNumber}-L005`,
    description: "Inland Transportation",
    category: "Transport",
    quantity: 2,
    unitPrice: 2500,
    total: 5000,
    currency: "USD"
  }
];

export function LineItemsModal({ quote, isOpen, onClose }: LineItemsModalProps) {
  // Use real line items from quote if available, otherwise use mock data
  const lineItems = quote.lineItems && quote.lineItems.length > 0 
    ? quote.lineItems 
    : getMockLineItems(quote.quoteReference);
  
  if (!isOpen) return null;

  const totalAmount = lineItems.reduce((sum, item) => {
    // Handle both mock and real data structures
    if ('total' in item) return sum + item.total;
    if (item.sellPrice?.amount) return sum + item.sellPrice.amount;
    return sum;
  }, 0);

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Line Items Detail</h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Quote: <span className="font-medium text-foreground">{quote.quoteReference}</span></p>
              <p>Customer: <span className="font-medium text-foreground">{quote.customer?.name || 'Unknown'}</span></p>
              <p>Route: <span className="font-medium text-foreground">{quote.shipment?.originPort || 'Unknown'} → {quote.shipment?.destinationPort || 'Unknown'}</span></p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item: any, index: number) => (
                  <TableRow key={item.id || item.lineNumber || index}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        item.unitPrice || item.sellPrice?.amount || 0,
                        item.currency || item.sellPrice?.currency || 'USD'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(
                        item.total || (item.sellPrice?.amount * item.quantity) || 0,
                        item.currency || item.sellPrice?.currency || 'USD'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Total:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalAmount, "USD")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {lineItems.length} line items
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}