"use client"

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Package, TrendingUp } from 'lucide-react';

interface LineItem {
  description: string;
  category: string;
  amount: number;
  currency: string;
  cost?: number;
  sellPrice?: number;
  margin?: number;
  marginPercentage?: number;
  supplier?: string;
  origin?: string;
  destination?: string;
  quantity?: number;
  unit?: string;
}

interface LineItemsDetailedProps {
  lineItems: LineItem[];
  quoteReference: string;
  customerName: string;
  originPort: string;
  destinationPort: string;
  totalMargin?: number;
}

export function LineItemsDetailed({ 
  lineItems, 
  quoteReference, 
  customerName,
  originPort,
  destinationPort,
  totalMargin = 15 
}: LineItemsDetailedProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<LineItem | null>(null);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Calculate cost and margin for each item based on total margin
  const enrichedItems = lineItems.map((item, index) => {
    const sellPrice = item.amount || item.sellPrice || 0;
    const marginPercentage = item.marginPercentage || totalMargin;
    const cost = item.cost || (sellPrice * (1 - marginPercentage / 100));
    const margin = sellPrice - cost;
    
    // Determine supplier based on category
    let supplier = item.supplier;
    if (!supplier) {
      if (item.category === 'Freight' || item.category === 'Ocean Freight') {
        supplier = 'MSC / Maersk / CMA CGM';
      } else if (item.category === 'Port Charges') {
        supplier = originPort.includes('China') ? 'SIPG / COSCO Ports' : 'DP World / Patrick Terminals';
      } else if (item.category === 'Documentation') {
        supplier = 'PGL Internal';
      } else if (item.category === 'Customs') {
        supplier = 'Local Customs Broker';
      } else if (item.category === 'Transport' || item.category === 'Inland Haulage') {
        supplier = 'Local Transport Provider';
      } else if (item.category === 'Insurance') {
        supplier = 'Marine Insurance Co.';
      } else {
        supplier = 'Third Party Vendor';
      }
    }

    return {
      ...item,
      sellPrice,
      cost,
      margin,
      marginPercentage,
      supplier,
      origin: item.origin || originPort,
      destination: item.destination || destinationPort
    };
  });

  const totalSellPrice = enrichedItems.reduce((sum, item) => sum + item.sellPrice, 0);
  const totalCost = enrichedItems.reduce((sum, item) => sum + item.cost, 0);
  const totalMarginAmount = totalSellPrice - totalCost;

  return (
    <>
      <div className="space-y-4">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Line Items Breakdown
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lineItems.length} items • Total Value: {formatCurrency(totalSellPrice, lineItems[0]?.currency || 'USD')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-center p-3 font-medium">Route</th>
                  <th className="text-right p-3 font-medium">Cost</th>
                  <th className="text-right p-3 font-medium">Sell Price</th>
                  <th className="text-right p-3 font-medium">Margin</th>
                  <th className="text-center p-3 font-medium">Margin %</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {enrichedItems.map((item, index) => (
                  <tr 
                    key={index} 
                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="p-3">
                      <div className="font-medium">{item.description}</div>
                      {item.quantity && (
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity} {item.unit || 'units'}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="font-normal">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="max-w-[150px] truncate" title={item.supplier}>
                        {item.supplier}
                      </div>
                    </td>
                    <td className="p-3 text-center text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <span className="truncate max-w-[80px]" title={item.origin}>
                          {item.origin.split(',')[0]}
                        </span>
                        <span>→</span>
                        <span className="truncate max-w-[80px]" title={item.destination}>
                          {item.destination.split(',')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {formatCurrency(item.cost, item.currency)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      {formatCurrency(item.sellPrice, item.currency)}
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        +{formatCurrency(item.margin, item.currency)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge 
                        variant={item.marginPercentage > 20 ? "default" : item.marginPercentage > 10 ? "secondary" : "outline"}
                        className="font-mono"
                      >
                        {item.marginPercentage.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(index);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedItems.has(index) ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr className="font-semibold">
                  <td colSpan={4} className="p-3 text-right">Totals:</td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(totalCost, lineItems[0]?.currency || 'USD')}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(totalSellPrice, lineItems[0]?.currency || 'USD')}
                  </td>
                  <td className="p-3 text-right font-mono text-green-600 dark:text-green-400">
                    +{formatCurrency(totalMarginAmount, lineItems[0]?.currency || 'USD')}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="default" className="font-mono">
                      {((totalMarginAmount / totalSellPrice) * 100).toFixed(1)}%
                    </Badge>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Expandable details for each item */}
          {Array.from(expandedItems).map(index => {
            const item = enrichedItems[index];
            return (
              <div key={index} className="border-t bg-muted/20 p-4 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Full Description</label>
                    <p className="font-medium">{item.description}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Supplier Details</label>
                    <p className="font-medium">{item.supplier}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Origin Port</label>
                    <p className="font-medium">{item.origin}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Destination Port</label>
                    <p className="font-medium">{item.destination}</p>
                  </div>
                  {item.quantity && (
                    <div>
                      <label className="text-sm text-muted-foreground">Quantity</label>
                      <p className="font-medium">{item.quantity} {item.unit || 'units'}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-muted-foreground">Unit Cost</label>
                    <p className="font-medium">
                      {item.quantity ? formatCurrency(item.cost / item.quantity, item.currency) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Profit Margin</label>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(item.margin, item.currency)} ({item.marginPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Line Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="font-medium">{selectedItem.description}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Category</label>
                  <Badge variant="outline">{selectedItem.category}</Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Supplier</label>
                  <p className="font-medium">{selectedItem.supplier}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Route</label>
                  <p className="font-medium text-sm">
                    {selectedItem.origin} → {selectedItem.destination}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Financial Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cost Price:</span>
                    <span className="font-mono">{formatCurrency(selectedItem.cost, selectedItem.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sell Price:</span>
                    <span className="font-mono font-medium">{formatCurrency(selectedItem.sellPrice, selectedItem.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Margin:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      +{formatCurrency(selectedItem.margin, selectedItem.currency)} ({selectedItem.marginPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Quote Reference: {quoteReference}</p>
                <p>Customer: {customerName}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}