"use client"

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Ship,
  MapPin,
  Building,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import type { FreightQuote } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QuoteAggregationsProps {
  quotes: FreightQuote[];
  className?: string;
  onDrillDown?: (filter: any) => void;
}

type AggregationType = 'customer' | 'route' | 'month' | 'shipmentMode' | 'supplier';
type ChartType = 'bar' | 'pie' | 'line' | 'area';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

export function QuoteAggregations({ 
  quotes, 
  className,
  onDrillDown 
}: QuoteAggregationsProps) {
  const [aggregationType, setAggregationType] = useState<AggregationType>('customer');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedMetric, setSelectedMetric] = useState<'total' | 'count' | 'average'>('total');

  // Calculate aggregations
  const aggregations = useMemo(() => {
    const grouped: Record<string, { total: number; count: number; quotes: FreightQuote[] }> = {};

    quotes.forEach(quote => {
      let key: string;
      switch (aggregationType) {
        case 'customer':
          key = quote.customer.name;
          break;
        case 'route':
          key = `${quote.shipment.originPort} - ${quote.shipment.destinationPort}`;
          break;
        case 'month':
          const date = new Date(quote.dateIssued);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'shipmentMode':
          key = quote.shipment.shipmentMode;
          break;
        case 'supplier':
          key = quote.supplier.name;
          break;
        default:
          key = 'Unknown';
      }

      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0, quotes: [] };
      }

      grouped[key].total += quote.financialMetrics.totalSellPrice.amount;
      grouped[key].count += 1;
      grouped[key].quotes.push(quote);
    });

    // Convert to array and sort
    const data = Object.entries(grouped).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      average: data.total / data.count,
      quotes: data.quotes
    }));

    // Sort by selected metric
    data.sort((a, b) => b[selectedMetric] - a[selectedMetric]);

    return data;
  }, [quotes, aggregationType, selectedMetric]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAmount = quotes.reduce((sum, q) => sum + q.financialMetrics.totalSellPrice.amount, 0);
    const totalMargin = quotes.reduce((sum, q) => sum + q.financialMetrics.totalMargin.amount, 0);
    const avgAmount = totalAmount / quotes.length;
    const avgMargin = totalMargin / quotes.length;
    const marginPercentage = (totalMargin / totalAmount) * 100;

    // Calculate trend (mock data - in real app would compare with previous period)
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const trendPercentage = Math.random() * 20;

    return {
      totalAmount,
      totalMargin,
      avgAmount,
      avgMargin,
      marginPercentage,
      quotesCount: quotes.length,
      trend,
      trendPercentage,
      currency: quotes[0]?.financialMetrics.totalSellPrice.currency || 'USD'
    };
  }, [quotes]);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getIcon = (type: AggregationType) => {
    switch (type) {
      case 'customer': return <Building className="h-4 w-4" />;
      case 'route': return <MapPin className="h-4 w-4" />;
      case 'month': return <Calendar className="h-4 w-4" />;
      case 'shipmentMode': return <Ship className="h-4 w-4" />;
      case 'supplier': return <Package className="h-4 w-4" />;
    }
  };

  const handleDrillDown = (item: any) => {
    if (onDrillDown) {
      const filter: any = {};
      switch (aggregationType) {
        case 'customer':
          filter.customer = item.name;
          break;
        case 'route':
          const [origin, destination] = item.name.split(' - ');
          filter.originPort = origin;
          filter.destinationPort = destination;
          break;
        case 'shipmentMode':
          filter.shipmentMode = item.name;
          break;
        case 'supplier':
          filter.supplier = item.name;
          break;
      }
      onDrillDown(filter);
    }
  };

  const renderChart = () => {
    const data = aggregations.slice(0, 10); // Top 10 items

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis tickFormatter={(value) => formatCompactNumber(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value, summaryStats.currency)} />
              <Legend />
              <Bar 
                dataKey={selectedMetric} 
                fill="#0088FE" 
                onClick={handleDrillDown}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${formatCompactNumber(entry[selectedMetric])}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={selectedMetric}
                onClick={handleDrillDown}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value, summaryStats.currency)} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis tickFormatter={(value) => formatCompactNumber(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value, summaryStats.currency)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#0088FE" 
                strokeWidth={2}
                dot={{ onClick: handleDrillDown, cursor: 'pointer' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis tickFormatter={(value) => formatCompactNumber(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value, summaryStats.currency)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#0088FE" 
                fill="#0088FE" 
                fillOpacity={0.6}
                onClick={handleDrillDown}
                cursor="pointer"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.totalAmount, summaryStats.currency)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {summaryStats.trend === 'up' ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{summaryStats.trendPercentage.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">-{summaryStats.trendPercentage.toFixed(1)}%</span>
                </>
              )}
              from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.totalMargin, summaryStats.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.marginPercentage.toFixed(1)}% margin rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quote</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.avgAmount, summaryStats.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per quote average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.quotesCount}</div>
            <p className="text-xs text-muted-foreground">
              Active quotes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Analysis</CardTitle>
            <div className="flex gap-2">
              <Select value={aggregationType} onValueChange={(v) => setAggregationType(v as AggregationType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">By Customer</SelectItem>
                  <SelectItem value="route">By Route</SelectItem>
                  <SelectItem value="month">By Month</SelectItem>
                  <SelectItem value="shipmentMode">By Shipment Mode</SelectItem>
                  <SelectItem value="supplier">By Supplier</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total Amount</SelectItem>
                  <SelectItem value="count">Quote Count</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                </SelectContent>
              </Select>

              <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            {aggregationType === 'customer' && 'Quote distribution by customer'}
            {aggregationType === 'route' && 'Quote distribution by shipping route'}
            {aggregationType === 'month' && 'Quote trends over time'}
            {aggregationType === 'shipmentMode' && 'Quote distribution by shipment mode'}
            {aggregationType === 'supplier' && 'Quote distribution by supplier'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Top Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon(aggregationType)}
            Top {aggregationType === 'customer' ? 'Customers' : 
                aggregationType === 'route' ? 'Routes' : 
                aggregationType === 'month' ? 'Months' :
                aggregationType === 'shipmentMode' ? 'Shipment Modes' : 'Suppliers'}
          </CardTitle>
          <CardDescription>
            Ranked by {selectedMetric === 'total' ? 'total amount' : 
                      selectedMetric === 'count' ? 'number of quotes' : 'average amount'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aggregations.slice(0, 5).map((item, index) => (
              <div 
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleDrillDown(item)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.count} quote{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(item[selectedMetric], summaryStats.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {((item[selectedMetric] / aggregations.reduce((sum, a) => sum + a[selectedMetric], 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}