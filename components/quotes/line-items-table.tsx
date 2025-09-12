"use client"

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { LineItem } from '@/lib/types/quote';
import { cn } from '@/lib/utils';

interface LineItemsTableProps {
  lineItems: LineItem[];
  showQuoteColumn?: boolean;
  quoteReference?: string;
  enableFiltering?: boolean;
  className?: string;
}

type SortField = 'lineNumber' | 'description' | 'category' | 'quantity' | 'sellPrice';
type SortDirection = 'asc' | 'desc';

export function LineItemsTable({
  lineItems,
  showQuoteColumn = false,
  quoteReference,
  enableFiltering = true,
  className
}: LineItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('lineNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(lineItems.map(item => item.category));
    return Array.from(cats);
  }, [lineItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = lineItems;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'sellPrice') {
        aVal = a.sellPrice.amount;
        bVal = b.sellPrice.amount;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [lineItems, searchTerm, categoryFilter, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    const items = filteredAndSortedItems;
    return {
      totalItems: items.length,
      totalAmount: items.reduce((sum, item) => sum + item.sellPrice.amount, 0),
      currency: items[0]?.sellPrice.currency || 'USD',
      byCategory: categories.reduce((acc, cat) => {
        const catItems = items.filter(item => item.category === cat);
        acc[cat] = {
          count: catItems.length,
          amount: catItems.reduce((sum, item) => sum + item.sellPrice.amount, 0)
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    };
  }, [filteredAndSortedItems, categories]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (lineNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(lineNumber)) {
      newExpanded.delete(lineNumber);
    } else {
      newExpanded.add(lineNumber);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cargo': return 'bg-blue-100 text-blue-800';
      case 'freight': return 'bg-green-100 text-green-800';
      case 'origin': return 'bg-yellow-100 text-yellow-800';
      case 'destination': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      {enableFiltering && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search descriptions or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              All Categories
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className="capitalize"
              >
                {cat} ({totals.byCategory[cat]?.count || 0})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Items</div>
          <div className="text-2xl font-bold">{totals.totalItems}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Amount</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totals.totalAmount, totals.currency)}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Average per Item</div>
          <div className="text-2xl font-bold">
            {formatCurrency(
              totals.totalItems > 0 ? totals.totalAmount / totals.totalItems : 0,
              totals.currency
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showQuoteColumn && (
                <TableHead>Quote</TableHead>
              )}
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('lineNumber')}
                  className="h-auto p-0 font-medium"
                >
                  Line #
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('description')}
                  className="h-auto p-0 font-medium"
                >
                  Description
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('category')}
                  className="h-auto p-0 font-medium"
                >
                  Category
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('quantity')}
                  className="h-auto p-0 font-medium"
                >
                  Qty
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('sellPrice')}
                  className="h-auto p-0 font-medium"
                >
                  Total
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Margin %</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showQuoteColumn ? 11 : 10} 
                  className="h-24 text-center"
                >
                  No line items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item) => (
                <>
                  <TableRow key={item.lineNumber}>
                    {showQuoteColumn && (
                      <TableCell className="font-medium">
                        {quoteReference}
                      </TableCell>
                    )}
                    <TableCell>{item.lineNumber}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={item.description}>
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", getCategoryColor(item.category))}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.supplier || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      {item.unitPrice 
                        ? formatCurrency(item.unitPrice.amount, item.unitPrice.currency)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.sellPrice.amount, item.sellPrice.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.marginPercentage 
                        ? `${item.marginPercentage.toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {item.dimensions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(item.lineNumber)}
                        >
                          {expandedRows.has(item.lineNumber) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(item.lineNumber) && item.dimensions && (
                    <TableRow>
                      <TableCell colSpan={showQuoteColumn ? 11 : 10}>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Length:</span>
                              <span className="ml-2 font-medium">{item.dimensions.length || '-'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Width:</span>
                              <span className="ml-2 font-medium">{item.dimensions.width || '-'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Height:</span>
                              <span className="ml-2 font-medium">{item.dimensions.height || '-'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Weight:</span>
                              <span className="ml-2 font-medium">{item.dimensions.weight || '-'} kg</span>
                            </div>
                          </div>
                          {item.costPrice && (
                            <div className="mt-4 grid grid-cols-3 gap-4">
                              <div>
                                <span className="text-sm text-muted-foreground">Cost Price:</span>
                                <span className="ml-2 font-medium">
                                  {formatCurrency(item.costPrice.amount, item.costPrice.currency)}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Sell Price:</span>
                                <span className="ml-2 font-medium">
                                  {formatCurrency(item.sellPrice.amount, item.sellPrice.currency)}
                                </span>
                              </div>
                              {item.margin && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Margin:</span>
                                  <span className="ml-2 font-medium">
                                    {formatCurrency(item.margin.amount, item.margin.currency)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Category Breakdown */}
      {enableFiltering && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map(cat => (
            <div key={cat} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("capitalize", getCategoryColor(cat))}>
                  {cat}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {totals.byCategory[cat]?.count || 0} items
                </span>
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(totals.byCategory[cat]?.amount || 0, totals.currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}