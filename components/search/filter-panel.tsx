"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  Building,
  Ship,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@/lib/types/search';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply?: () => void;
  onReset?: () => void;
  availableOptions?: {
    customers?: string[];
    originPorts?: string[];
    destinationPorts?: string[];
    shipmentModes?: string[];
    suppliers?: string[];
  };
  isLoading?: boolean;
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  availableOptions = {},
  isLoading = false,
  className
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (localFilters.customer) count++;
    if (localFilters.originPort) count++;
    if (localFilters.destinationPort) count++;
    if (localFilters.shipmentMode) count++;
    if (localFilters.supplier) count++;
    if (localFilters.minAmount) count++;
    if (localFilters.maxAmount) count++;
    if (localFilters.dateFrom) count++;
    if (localFilters.dateTo) count++;
    setActiveFiltersCount(count);
  }, [localFilters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    
    // Auto-apply if no explicit apply button
    if (!onApply) {
      onFiltersChange(updated);
    }
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    if (onApply) onApply();
  };

  const handleReset = () => {
    const emptyFilters: SearchFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    if (onReset) onReset();
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const updated = { ...localFilters };
    delete updated[key];
    setLocalFilters(updated);
    
    if (!onApply) {
      onFiltersChange(updated);
    }
  };

  const formatDateForDisplay = (date: Date | string | undefined) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant={isExpanded ? "default" : "outline"}
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {localFilters.customer && (
              <Badge variant="secondary" className="gap-1">
                <Building className="h-3 w-3" />
                {localFilters.customer}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('customer')}
                />
              </Badge>
            )}
            {localFilters.originPort && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                From: {localFilters.originPort}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('originPort')}
                />
              </Badge>
            )}
            {localFilters.destinationPort && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                To: {localFilters.destinationPort}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('destinationPort')}
                />
              </Badge>
            )}
            {localFilters.shipmentMode && (
              <Badge variant="secondary" className="gap-1">
                <Ship className="h-3 w-3" />
                {localFilters.shipmentMode}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFilter('shipmentMode')}
                />
              </Badge>
            )}
            {(localFilters.minAmount || localFilters.maxAmount) && (
              <Badge variant="secondary" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {localFilters.minAmount && `Min: $${localFilters.minAmount.toLocaleString()}`}
                {localFilters.minAmount && localFilters.maxAmount && ' - '}
                {localFilters.maxAmount && `Max: $${localFilters.maxAmount.toLocaleString()}`}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => {
                    removeFilter('minAmount');
                    removeFilter('maxAmount');
                  }}
                />
              </Badge>
            )}
            {(localFilters.dateFrom || localFilters.dateTo) && (
              <Badge variant="secondary" className="gap-1">
                <CalendarIcon className="h-3 w-3" />
                {localFilters.dateFrom && formatDateForDisplay(localFilters.dateFrom)}
                {localFilters.dateFrom && localFilters.dateTo && ' - '}
                {localFilters.dateTo && formatDateForDisplay(localFilters.dateTo)}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => {
                    removeFilter('dateFrom');
                    removeFilter('dateTo');
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Customer Filter */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={localFilters.customer || ''}
                onValueChange={(value) => handleFilterChange('customer', value || undefined)}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Customers</SelectItem>
                  {availableOptions.customers?.map(customer => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origin Port Filter */}
            <div className="space-y-2">
              <Label htmlFor="originPort">Origin Port</Label>
              <Select
                value={localFilters.originPort || ''}
                onValueChange={(value) => handleFilterChange('originPort', value || undefined)}
              >
                <SelectTrigger id="originPort">
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Origins</SelectItem>
                  {availableOptions.originPorts?.map(port => (
                    <SelectItem key={port} value={port}>
                      {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination Port Filter */}
            <div className="space-y-2">
              <Label htmlFor="destinationPort">Destination Port</Label>
              <Select
                value={localFilters.destinationPort || ''}
                onValueChange={(value) => handleFilterChange('destinationPort', value || undefined)}
              >
                <SelectTrigger id="destinationPort">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Destinations</SelectItem>
                  {availableOptions.destinationPorts?.map(port => (
                    <SelectItem key={port} value={port}>
                      {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shipment Mode Filter */}
            <div className="space-y-2">
              <Label htmlFor="shipmentMode">Shipment Mode</Label>
              <Select
                value={localFilters.shipmentMode || ''}
                onValueChange={(value) => handleFilterChange('shipmentMode', value || undefined)}
              >
                <SelectTrigger id="shipmentMode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Modes</SelectItem>
                  <SelectItem value="FCL">FCL</SelectItem>
                  <SelectItem value="LCL">LCL</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Rail">Rail</SelectItem>
                  <SelectItem value="Road">Road</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={localFilters.supplier || ''}
                onValueChange={(value) => handleFilterChange('supplier', value || undefined)}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Suppliers</SelectItem>
                  {availableOptions.suppliers?.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label>Amount Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateFrom ? formatDateForDisplay(localFilters.dateFrom) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                    onSelect={(date) => handleFilterChange('dateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateTo ? formatDateForDisplay(localFilters.dateTo) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                    onSelect={(date) => handleFilterChange('dateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={activeFiltersCount === 0 || isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            {onApply && (
              <Button
                onClick={handleApply}
                disabled={isLoading}
              >
                Apply Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}