export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface Customer {
  name: string;
  code?: string;
  contact?: string;
  email?: string;
  address?: string;
  country?: string;
}

export interface Supplier {
  name: string;
  code?: string;
  contact?: string;
  email?: string;
}

export interface Shipment {
  originPort: string;
  destinationPort: string;
  originCountry?: string;
  destinationCountry?: string;
  shipmentMode: string;
  containerType?: string;
  containerCount?: number;
  transitTime?: string;
  departureDate?: string;
  arrivalDate?: string;
}

export interface LineItem {
  lineNumber: number;
  description: string;
  category: 'cargo' | 'freight' | 'origin' | 'destination' | 'other';
  supplier?: string;
  quantity: number;
  unit: string;
  unitPrice?: MoneyAmount;
  costPrice?: MoneyAmount;
  sellPrice: MoneyAmount;
  margin?: MoneyAmount;
  marginPercentage?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
}

export interface FinancialMetrics {
  totalCost: MoneyAmount;
  totalSellPrice: MoneyAmount;
  totalMargin: MoneyAmount;
  marginPercentage: number;
  breakdown?: {
    originCosts?: MoneyAmount;
    freightCosts?: MoneyAmount;
    destinationCosts?: MoneyAmount;
    otherCosts?: MoneyAmount;
  };
}

export interface FreightQuote {
  id: string;
  documentId: string;
  fileName: string;
  quoteReference: string;
  dateIssued: string;
  validUntil?: string;
  customer: Customer;
  supplier: Supplier;
  shipment: Shipment;
  lineItems: LineItem[];
  financialMetrics: FinancialMetrics;
  extractionConfidence?: string;
  processedAt: string;
  modelUsed?: string;
}