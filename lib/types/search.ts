export interface SearchFilters {
  customerName?: string;
  originPort?: string;
  destinationPort?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  shipmentMode?: string;
  containerType?: string;
  supplierName?: string;
}

export interface ParsedQuery {
  searchText?: string;
  filters: SearchFilters;
  aggregation?: {
    type: 'sum' | 'avg' | 'count' | 'min' | 'max';
    groupBy?: string[];
    field?: string;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export interface SearchResult {
  quotes: any[];
  totalCount: number;
  facets?: Record<string, number>;
  aggregations?: Record<string, any>;
}