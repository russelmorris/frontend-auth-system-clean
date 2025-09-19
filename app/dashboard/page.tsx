"use client"

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { NotesModal } from '@/components/ui/notes-modal';
import { Download, Filter, Search, Package, FileText, X, Eye, Weight, Maximize, Clock, Thermometer, AlertTriangle, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';

interface LineItem {
  id: string;
  quoteId: string;
  quoteReference: string;
  quoteDate: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  cost?: number;
  margin?: number;
  marginPercentage?: number;
  supplier?: string;
  origin?: string;
  destination?: string;
}

interface Quote {
  id: string;
  documentId: string;
  fileName: string;
  quoteReference: string;
  customer: { name: string };
  shipment: { 
    originPort: string; 
    destinationPort: string;
    totalWeightKg?: number;
    totalVolumeCbm?: number;
    containerCount?: string;
    transitTimeDays?: string;
    temperatureRange?: string;
  };
  financialMetrics: { 
    totalSellPrice: { amount: number; currency: string };
    marginPercentage: number;
  };
  specialConditions?: {
    hazardous?: boolean;
    refrigerated_2_8?: boolean;
    refrigerated_minus20_minus10?: boolean;
    refrigerated_other?: boolean;
    oversized?: boolean;
    timeSensitive?: boolean;
    highValue?: boolean;
  };
  lineItems: any[];
  lineItemCount: number;
  date_issued?: string;
  notes?: string;
  extractionConfidence?: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [allLineItems, setAllLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterSearch, setMasterSearch] = useState('');
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean; quote: Quote | null }>({
    isOpen: false,
    quote: null
  });

  // Check if user is admin
  const isAdmin = session?.user?.email && ['russ@skyeam.com.au', 'info@consultai.com.au'].includes(session.user.email.toLowerCase());
  
  // Quote filters
  const [quoteCustomerFilter, setQuoteCustomerFilter] = useState<string[]>([]);
  const [quoteOriginFilter, setQuoteOriginFilter] = useState<string[]>([]);
  const [quoteDestinationFilter, setQuoteDestinationFilter] = useState<string[]>([]);
  const [quoteFileFilter, setQuoteFileFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // New filters for weight, volume, transit
  const [weightFilter, setWeightFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [transitFilter, setTransitFilter] = useState('all');
  
  // Special conditions filter
  const [specialConditionsFilter, setSpecialConditionsFilter] = useState<string[]>([]);
  
  // Line item filters
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [originFilter, setOriginFilter] = useState<string[]>([]);
  const [destinationFilter, setDestinationFilter] = useState<string[]>([]);
  const [descriptionIncludes, setDescriptionIncludes] = useState('');
  const [descriptionExcludes, setDescriptionExcludes] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);

  // Subtle color palette
  const colors = [
    { bg: 'bg-blue-50 dark:bg-slate-900/30', border: 'border-blue-200 dark:border-slate-700' },
    { bg: 'bg-emerald-50 dark:bg-slate-900/30', border: 'border-emerald-200 dark:border-slate-700' },
    { bg: 'bg-violet-50 dark:bg-slate-900/30', border: 'border-violet-200 dark:border-slate-700' },
    { bg: 'bg-amber-50 dark:bg-slate-900/30', border: 'border-amber-200 dark:border-slate-700' },
    { bg: 'bg-rose-50 dark:bg-slate-900/30', border: 'border-rose-200 dark:border-slate-700' },
    { bg: 'bg-sky-50 dark:bg-slate-900/30', border: 'border-sky-200 dark:border-slate-700' },
    { bg: 'bg-indigo-50 dark:bg-slate-900/30', border: 'border-indigo-200 dark:border-slate-700' },
  ];
  
  // Create a stable color mapping based on all quotes
  const quoteColorMap = useMemo(() => {
    const map = new Map();
    quotes.forEach((quote, index) => {
      map.set(quote.id, colors[index % colors.length]);
    });
    return map;
  }, [quotes]);

  // Get unique options for multi-selects
  const uniqueOrigins = useMemo(() => {
    const origins = new Set<string>();
    allLineItems.forEach(item => {
      if (item.origin) origins.add(item.origin);
    });
    quotes.forEach(quote => {
      if (quote.shipment?.originPort) origins.add(quote.shipment.originPort);
    });
    return Array.from(origins).sort();
  }, [allLineItems, quotes]);

  const uniqueDestinations = useMemo(() => {
    const destinations = new Set<string>();
    allLineItems.forEach(item => {
      if (item.destination) destinations.add(item.destination);
    });
    quotes.forEach(quote => {
      if (quote.shipment?.destinationPort) destinations.add(quote.shipment.destinationPort);
    });
    return Array.from(destinations).sort();
  }, [allLineItems, quotes]);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    allLineItems.forEach(item => {
      if (item.supplier) suppliers.add(item.supplier);
    });
    return Array.from(suppliers).sort();
  }, [allLineItems]);

  const uniqueCustomers = useMemo(() => {
    const customers = new Set<string>();
    quotes.forEach(quote => {
      if (quote.customer?.name) customers.add(quote.customer.name);
    });
    return Array.from(customers).sort();
  }, [quotes]);

  const uniqueFiles = useMemo(() => {
    const files = new Set<string>();
    quotes.forEach(quote => {
      if (quote.fileName) files.add(quote.fileName);
    });
    return Array.from(files).sort();
  }, [quotes]);

  useEffect(() => {
    fetchAllQuotes();
  }, []);

  const fetchAllQuotes = async () => {
    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchText: '', limit: 100 })
      });
      
      if (!response.ok) throw new Error('Failed to fetch quotes');
      
      const data = await response.json();
      setQuotes(data.results || []);
      
      // Extract all line items with color coding
      const items = extractLineItems(data.results || []);
      setAllLineItems(items);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterSearch = async () => {
    if (!masterSearch.trim()) {
      fetchAllQuotes();
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchText: masterSearch, limit: 100 })
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setQuotes(data.results || []);
      
      const items = extractLineItems(data.results || []);
      setAllLineItems(items);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractLineItems = (quotes: Quote[]) => {
    const items: LineItem[] = [];
    
    quotes.forEach((quote) => {
      if (quote.lineItems && Array.isArray(quote.lineItems)) {
        quote.lineItems.forEach((item, index) => {
          // Calculate margin with category-based defaults
          const sellPrice = item.sellPrice?.amount || item.amount || 0;
          let cost = sellPrice * 0.8; // Default 20% margin
          let marginPercentage = 20;
          
          // Apply category-specific margins
          if (item.category === 'Freight') {
            marginPercentage = 80;
            cost = sellPrice / 1.8;
          } else if (item.category === 'Documentation') {
            marginPercentage = 150;
            cost = sellPrice / 2.5;
          } else if (item.category === 'Port Charges') {
            marginPercentage = 50;
            cost = sellPrice / 1.5;
          } else if (item.category === 'Customs') {
            marginPercentage = 60;
            cost = sellPrice / 1.6;
          } else if (item.category === 'Transport') {
            marginPercentage = 40;
            cost = sellPrice / 1.4;
          }
          
          const margin = sellPrice - cost;
          
          items.push({
            id: `${quote.id}-${index}`,
            quoteId: quote.id,
            quoteReference: quote.quoteReference,
            quoteDate: quote.date_issued || '',
            description: item.description || '',
            category: item.category || 'Other',
            amount: sellPrice,
            currency: item.sellPrice?.currency || item.currency || quote.financialMetrics?.totalSellPrice?.currency || 'USD',
            cost: cost,
            margin: margin,
            marginPercentage: marginPercentage,
            supplier: item.supplier || 'TBD',
            origin: quote.shipment?.originPort || '',
            destination: quote.shipment?.destinationPort || ''
          });
        });
      }
    });
    
    return items;
  };

  const handleDownload = async (quote: Quote) => {
    try {
      // First try to get the actual PDF from the database
      const response = await fetch(`/api/pdf/${quote.documentId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.pdfBase64) {
          // Convert base64 to blob
          const byteCharacters = atob(data.pdfBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = quote.fileName || `${quote.quoteReference}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          console.log(`Downloaded PDF: ${quote.fileName}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
    
    // Fallback to JSON export if PDF not available
    console.log('PDF not available, exporting as JSON');
    const data = {
      quote: {
        reference: quote.quoteReference,
        customer: quote.customer,
        shipment: quote.shipment,
        financialMetrics: quote.financialMetrics,
        date: quote.date_issued,
        notes: quote.notes,
        specialConditions: quote.specialConditions,
        metadata: {
          documentId: quote.documentId,
          fileName: quote.fileName,
          extractionConfidence: quote.extractionConfidence
        }
      },
      lineItems: allLineItems.filter(item => item.quoteId === quote.id).map(item => ({
        description: item.description,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        cost: item.cost,
        margin: item.margin,
        marginPercentage: item.marginPercentage
      })),
      exportInfo: {
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        note: 'PDF not available. Complete quote data export.'
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quote.quoteReference}_quote_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setQuoteCustomerFilter([]);
    setQuoteOriginFilter([]);
    setQuoteDestinationFilter([]);
    setQuoteFileFilter([]);
    setDateFrom('');
    setDateTo('');
    setWeightFilter('all');
    setVolumeFilter('all');
    setTransitFilter('all');
    setSpecialConditionsFilter([]);
    setCategoryFilter([]);
    setOriginFilter([]);
    setDestinationFilter([]);
    setDescriptionIncludes('');
    setDescriptionExcludes('');
    setSupplierFilter([]);
    setMasterSearch('');
    fetchAllQuotes();
  };

  // Filter functions for weight, volume, transit
  const filterByWeight = (weight: number | undefined) => {
    if (weightFilter === 'all' || !weight) return true;
    const weightTons = weight / 1000;
    
    switch (weightFilter) {
      case 'light': return weightTons < 25;
      case 'medium': return weightTons >= 25 && weightTons < 50;
      case 'heavy': return weightTons >= 50 && weightTons < 100;
      case 'veryHeavy': return weightTons >= 100 && weightTons < 250;
      case 'ultraHeavy': return weightTons >= 250;
      default: return true;
    }
  };

  const filterByVolume = (volume: number | undefined) => {
    if (volumeFilter === 'all' || !volume) return true;
    
    switch (volumeFilter) {
      case 'small': return volume < 100;
      case 'medium': return volume >= 100 && volume < 250;
      case 'large': return volume >= 250 && volume < 500;
      case 'veryLarge': return volume >= 500 && volume < 1000;
      case 'massive': return volume >= 1000;
      default: return true;
    }
  };

  const filterByTransit = (transit: string | undefined) => {
    if (transitFilter === 'all' || !transit) return true;
    
    // Extract the first number from transit string (e.g., "14-16" -> 14)
    const match = transit.match(/\d+/);
    const days = match ? parseInt(match[0]) : 0;
    
    switch (transitFilter) {
      case 'express': return days <= 10;
      case 'fast': return days > 10 && days <= 20;
      case 'standard': return days > 20 && days <= 30;
      case 'slow': return days > 30;
      default: return true;
    }
  };

  const filterBySpecialConditions = (conditions: any) => {
    if (specialConditionsFilter.length === 0) return true;
    
    return specialConditionsFilter.every(filter => {
      switch (filter) {
        case 'hazardous': return conditions?.hazardous;
        case 'refrigerated_2_8': return conditions?.refrigerated_2_8;
        case 'refrigerated_minus20_minus10': return conditions?.refrigerated_minus20_minus10;
        case 'oversized': return conditions?.oversized;
        default: return false;
      }
    });
  };

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    // Customer filter
    if (quoteCustomerFilter.length > 0 && !quoteCustomerFilter.includes(quote.customer?.name)) {
      return false;
    }
    
    // Origin filter
    if (quoteOriginFilter.length > 0 && !quoteOriginFilter.includes(quote.shipment?.originPort)) {
      return false;
    }
    
    // Destination filter
    if (quoteDestinationFilter.length > 0 && !quoteDestinationFilter.includes(quote.shipment?.destinationPort)) {
      return false;
    }
    
    // File filter
    if (quoteFileFilter.length > 0 && !quoteFileFilter.includes(quote.fileName)) {
      return false;
    }
    
    // Date filters
    if (dateFrom && quote.date_issued && quote.date_issued < dateFrom) {
      return false;
    }
    if (dateTo && quote.date_issued && quote.date_issued > dateTo) {
      return false;
    }
    
    // Weight, volume, transit filters
    if (!filterByWeight(quote.shipment?.totalWeightKg)) return false;
    if (!filterByVolume(quote.shipment?.totalVolumeCbm)) return false;
    if (!filterByTransit(quote.shipment?.transitTimeDays)) return false;
    
    // Special conditions filter
    if (!filterBySpecialConditions(quote.specialConditions)) return false;
    
    return true;
  });

  // Filter line items based on filtered quotes and line item filters
  const filteredLineItems = allLineItems.filter(item => {
    // First check if the quote is filtered
    const quoteIsVisible = filteredQuotes.some(q => q.id === item.quoteId);
    if (!quoteIsVisible) return false;
    
    // Category filter
    if (categoryFilter.length > 0 && !categoryFilter.includes(item.category)) {
      return false;
    }
    
    // Origin filter
    if (originFilter.length > 0 && !originFilter.includes(item.origin)) {
      return false;
    }
    
    // Destination filter
    if (destinationFilter.length > 0 && !destinationFilter.includes(item.destination)) {
      return false;
    }
    
    // Description includes filter
    if (descriptionIncludes && !item.description.toLowerCase().includes(descriptionIncludes.toLowerCase())) {
      return false;
    }
    
    // Description excludes filter
    if (descriptionExcludes && item.description.toLowerCase().includes(descriptionExcludes.toLowerCase())) {
      return false;
    }
    
    // Supplier filter
    if (supplierFilter.length > 0 && !supplierFilter.includes(item.supplier || '')) {
      return false;
    }
    
    return true;
  });

  // Calculate totals
  const totalQuoteValue = filteredQuotes.reduce((sum, quote) => 
    sum + (quote.financialMetrics?.totalSellPrice?.amount || 0), 0
  );
  
  const totalLineItemValue = filteredLineItems.reduce((sum, item) => 
    sum + item.amount, 0
  );
  
  const totalMargin = filteredLineItems.reduce((sum, item) => 
    sum + (item.margin || 0), 0
  );

  const formatWeight = (kg: number | undefined) => {
    if (!kg) return 'N/A';
    const tons = kg / 1000;
    return `${tons.toFixed(1)}t`;
  };

  const formatVolume = (cbm: number | undefined) => {
    if (!cbm) return 'N/A';
    return `${cbm.toFixed(0)} CBM`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-[1920px] mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/pgl-logo.png" 
                alt="PGL" 
                width={40} 
                height={40}
                className="rounded"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Freight Quote Analytics
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/whitelist')}
                  size="sm"
                  className="bg-white dark:bg-gray-800"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage Access
                </Button>
              )}
              <Button
                variant="outline"
                onClick={clearAllFilters}
                size="sm"
                className="bg-white dark:bg-gray-800"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut()}
                size="sm"
                className="bg-white dark:bg-gray-800"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Master Search Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Natural language search across all quotes and line items..."
              value={masterSearch}
              onChange={(e) => setMasterSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMasterSearch()}
              className="flex-1"
            />
            <Button onClick={handleMasterSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Split Panel Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Panel - Freight Quotes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Freight Quotes
            </h2>
            
            {/* Quote Filters */}
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-3 gap-2">
                <MultiSelect
                  options={uniqueCustomers}
                  selected={quoteCustomerFilter}
                  onChange={setQuoteCustomerFilter}
                  placeholder="Filter by Customer"
                  className="w-full"
                />
                <MultiSelect
                  options={uniqueOrigins}
                  selected={quoteOriginFilter}
                  onChange={setQuoteOriginFilter}
                  placeholder="Filter by Origin"
                  className="w-full"
                />
                <MultiSelect
                  options={uniqueDestinations}
                  selected={quoteDestinationFilter}
                  onChange={setQuoteDestinationFilter}
                  placeholder="Filter by Destination"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Select value={weightFilter} onValueChange={setWeightFilter}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 h-9 text-sm">
                    <SelectValue placeholder="Weight Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="all">All Weights</SelectItem>
                    <SelectItem value="light">Light (&lt;25t)</SelectItem>
                    <SelectItem value="medium">Medium (25-50t)</SelectItem>
                    <SelectItem value="heavy">Heavy (50-100t)</SelectItem>
                    <SelectItem value="veryHeavy">Very Heavy (100-250t)</SelectItem>
                    <SelectItem value="ultraHeavy">Ultra Heavy (&gt;250t)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 h-9 text-sm">
                    <SelectValue placeholder="Volume Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="all">All Volumes</SelectItem>
                    <SelectItem value="small">Small (&lt;100 CBM)</SelectItem>
                    <SelectItem value="medium">Medium (100-250 CBM)</SelectItem>
                    <SelectItem value="large">Large (250-500 CBM)</SelectItem>
                    <SelectItem value="veryLarge">Very Large (500-1000 CBM)</SelectItem>
                    <SelectItem value="massive">Massive (&gt;1000 CBM)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={transitFilter} onValueChange={setTransitFilter}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 h-9 text-sm">
                    <SelectValue placeholder="Transit Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="all">All Transit Times</SelectItem>
                    <SelectItem value="express">Express (&le;10 days)</SelectItem>
                    <SelectItem value="fast">Fast (11-20 days)</SelectItem>
                    <SelectItem value="standard">Standard (21-30 days)</SelectItem>
                    <SelectItem value="slow">Slow (&gt;30 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Date From"
                  className="w-full"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Date To"
                  className="w-full"
                />
              </div>

              <MultiSelect
                options={[
                  { value: 'hazardous', label: 'Hazardous Materials' },
                  { value: 'refrigerated_2_8', label: 'Refrigerated (2-8°C)' },
                  { value: 'refrigerated_minus20_minus10', label: 'Frozen (-20 to -10°C)' },
                  { value: 'oversized', label: 'Oversized/Break Bulk' }
                ].map(opt => opt.value)}
                selected={specialConditionsFilter}
                onChange={setSpecialConditionsFilter}
                placeholder="Special Conditions"
                className="w-full"
              />
            </div>

            {/* Quote List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredQuotes.map((quote) => {
                const color = quoteColorMap.get(quote.id) || colors[0];
                const hasSpecialConditions = quote.specialConditions && 
                  Object.values(quote.specialConditions).some(v => v);
                
                return (
                  <div
                    key={quote.id}
                    className={`p-3 rounded-lg border-2 ${color.bg} ${color.border} transition-all hover:shadow-md`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-base">{quote.quoteReference}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {quote.customer?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base">
                          {formatCurrency(
                            quote.financialMetrics?.totalSellPrice?.amount || 0,
                            quote.financialMetrics?.totalSellPrice?.currency || 'USD'
                          )}
                        </div>
                        {quote.date_issued && (
                          <div className="text-xs text-gray-500">
                            {new Date(quote.date_issued).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex gap-3 text-xs">
                        <span><span className="text-gray-500">From:</span> {quote.shipment?.originPort}</span>
                        <span><span className="text-gray-500">To:</span> {quote.shipment?.destinationPort}</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Weight className="h-3 w-3 text-gray-500" />
                          <span>{formatWeight(quote.shipment?.totalWeightKg)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Maximize className="h-3 w-3 text-gray-500" />
                          <span>{formatVolume(quote.shipment?.totalVolumeCbm)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span>{quote.shipment?.transitTimeDays || 'N/A'} days</span>
                        </div>
                      </div>
                    </div>

                    {quote.shipment?.temperatureRange && quote.shipment.temperatureRange !== 'N/A' && (
                      <div className="flex items-center gap-1 text-xs mb-1">
                        <Thermometer className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600 font-medium text-xs">
                          {quote.shipment.temperatureRange}
                        </span>
                      </div>
                    )}

                    {hasSpecialConditions && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {quote.specialConditions?.hazardous && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Hazardous
                          </Badge>
                        )}
                        {quote.specialConditions?.refrigerated_2_8 && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Chilled 2-8°C
                          </Badge>
                        )}
                        {quote.specialConditions?.refrigerated_minus20_minus10 && (
                          <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">
                            Frozen -20°C
                          </Badge>
                        )}
                        {quote.specialConditions?.oversized && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            Oversized
                          </Badge>
                        )}
                        {quote.specialConditions?.timeSensitive && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 text-xs text-gray-600">
                        <span>{quote.lineItemCount} items</span>
                        <span>•</span>
                        <span>Margin: {quote.financialMetrics?.marginPercentage}%</span>
                        <span>•</span>
                        <span>{quote.shipment?.containerCount || 'N/A'}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setNotesModal({ isOpen: true, quote })}
                          className="h-7 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(quote)}
                          className="h-7 px-2"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Line Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Line Items
            </h2>
            
            {/* Line Item Filters */}
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-3 gap-2">
                <MultiSelect
                  options={['Freight', 'Port Charges', 'Documentation', 'Customs', 'Transport', 'Surcharge', 'Other']}
                  selected={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="Filter by Category"
                  className="w-full"
                />
                
                <MultiSelect
                  options={uniqueOrigins}
                  selected={originFilter}
                  onChange={setOriginFilter}
                  placeholder="Origin"
                  className="w-full"
                />
                
                <MultiSelect
                  options={uniqueDestinations}
                  selected={destinationFilter}
                  onChange={setDestinationFilter}
                  placeholder="Destination"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Description includes..."
                  value={descriptionIncludes}
                  onChange={(e) => setDescriptionIncludes(e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Description excludes..."
                  value={descriptionExcludes}
                  onChange={(e) => setDescriptionExcludes(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <MultiSelect
                options={uniqueSuppliers}
                selected={supplierFilter}
                onChange={setSupplierFilter}
                placeholder="Filter by Supplier"
                className="w-full"
              />
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Sell Price</th>
                    <th className="text-right p-2">Cost</th>
                    <th className="text-right p-2">Margin</th>
                    <th className="text-left p-2">Quote</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLineItems.map((item) => {
                    const color = quoteColorMap.get(item.quoteId) || colors[0];
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${color.bg}`}
                      >
                        <td className="p-2">{item.description}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(item.amount, item.currency)}
                        </td>
                        <td className="p-2 text-right text-gray-600">
                          {formatCurrency(item.cost || 0, item.currency)}
                        </td>
                        <td className="p-2 text-right">
                          <span className="text-green-600 font-medium">
                            {formatCurrency(item.margin || 0, item.currency)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({item.marginPercentage}%)
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-1 rounded ${color.bg} ${color.border} border`}>
                            {item.quoteReference}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {notesModal.quote && (
        <NotesModal
          isOpen={notesModal.isOpen}
          onClose={() => setNotesModal({ isOpen: false, quote: null })}
          quoteReference={notesModal.quote.quoteReference}
          notes={notesModal.quote.notes}
          specialConditions={
            Object.entries(notesModal.quote.specialConditions || {})
              .filter(([_, value]) => value)
              .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
          }
        />
      )}
    </div>
  );
}