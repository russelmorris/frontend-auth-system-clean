export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  field: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'text';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface ActiveFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
  value: any;
  label?: string;
}