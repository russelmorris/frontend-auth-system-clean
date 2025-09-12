"use client"

import { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
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
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { FreightQuote } from '@/lib/types';

interface QuoteTableProps {
  quotes: FreightQuote[];
  isLoading?: boolean;
  onDrillDown?: (quote: FreightQuote) => void;
}

export function QuoteTable({ quotes, isLoading, onDrillDown }: QuoteTableProps) {
  const router = useRouter();
  
  const columns = useMemo<ColumnDef<FreightQuote>[]>(() => [
    {
      accessorKey: 'quoteReference',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quote #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('quoteReference')}</div>
      ),
    },
    {
      accessorKey: 'customer.name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.original.customer.name}
        </div>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.shipment.originPort} → {row.original.shipment.destinationPort}
        </div>
      ),
    },
    {
      id: 'totalAmount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => row.financialMetrics.totalSellPrice.amount,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(
            row.original.financialMetrics.totalSellPrice.amount, 
            row.original.financialMetrics.totalSellPrice.currency
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dateIssued',
      header: 'Date',
      cell: ({ row }) => formatDate(row.getValue('dateIssued')),
    },
    {
      id: 'lineItemsCount',
      header: 'Line Items',
      cell: ({ row }) => {
        const count = row.original.lineItemCount || row.original.lineItems?.length || 0;
        return (
          <div className="text-center">
            <Badge variant="outline">
              {count} items
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'extractionConfidence',
      header: 'Confidence',
      cell: ({ row }) => {
        const confidence = row.getValue('extractionConfidence') as string;
        if (!confidence) return null;
        
        return (
          <Badge variant={confidence === 'high' ? 'default' : 'secondary'}>
            {confidence}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onDrillDown) {
                onDrillDown(quote);
              } else {
                router.push(`/quotes/${quote.id}`);
              }
            }}
          >
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        );
      },
    },
  ], [router, onDrillDown]);

  const table = useReactTable({
    data: quotes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No quotes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            quotes.length
          )}{' '}
          of {quotes.length} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}