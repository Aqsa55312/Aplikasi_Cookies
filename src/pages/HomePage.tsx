import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import type { Ingredient, DashboardSummary, Transaction } from '@shared/types';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calculator,
  Plus,
  Download,
  Banknote,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
export function HomePage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api<DashboardSummary>('/api/dashboard')
  });
  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api<{ items: Ingredient[] }>('/api/ingredients')
  });
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api<{ items: Transaction[] }>('/api/transactions')
  });
  const ingredients = useMemo(() => ingredientsData?.items ?? [], [ingredientsData]);
  const transactions = useMemo(() => transactionsData?.items ?? [], [transactionsData]);
  const exportReport = () => {
    if (!ingredients.length) return;
    const workbook = XLSX.utils.book_new();
    // Sheet 1: Inventory
    const invData = ingredients.map(i => ({
      'Nama Bahan': i.name,
      'Harga per Unit (IDR)': i.pricePerUnit,
      'Stok Saat Ini': i.stockQuantity,
      'Satuan': i.unit,
      'Stok Minimum': i.minimumStock,
      'Total Nilai (IDR)': i.pricePerUnit * (i.stockQuantity / (i.unit === 'g' || i.unit === 'ml' ? 1000 : 1))
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(invData), "Inventory");
    // Sheet 2: Sales
    const salesData = transactions.map(t => ({
      'ID': t.id,
      'Recipe': t.recipeName,
      'Qty': t.quantitySold,
      'Total Revenue': t.totalPrice,
      'Date': new Date(t.timestamp).toLocaleString('id-ID')
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesData), "Sales");
    // Sheet 3: Alerts
    const alertsData = ingredients.filter(i => i.stockQuantity <= i.minimumStock).map(i => ({
      'Item': i.name,
      'Current Stock': i.stockQuantity,
      'Minimum Threshold': i.minimumStock,
      'Unit': i.unit
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(alertsData), "Restock Alerts");
    XLSX.writeFile(workbook, `Bakery_Operations_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  return (
    <AppLayout container className="bg-[#FDF8F5]">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#4A2B11]">Bakery Overview</h1>
            <p className="text-[#4A2B11]/60">Welcome back. Here's what's happening in your kitchen today.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportReport} variant="outline" className="border-[#4A2B11]/10 bg-white text-[#4A2B11]">
              <Download className="mr-2 h-4 w-4" /> Multi-Sheet Report
            </Button>
            <Button asChild className="bg-[#F4A261] hover:bg-[#E55A1B] text-white shadow-md transition-transform active:scale-95">
              <Link to="/transactions">
                <Plus className="mr-2 h-4 w-4" /> New Sale
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none bg-white shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#4A2B11]/50">Total Revenue</CardTitle>
              <Banknote className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-xl font-bold text-emerald-600">
                  Rp {summary?.totalRevenue.toLocaleString('id-ID')}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#4A2B11]/50">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#F4A261]" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-xl font-bold text-[#4A2B11]">
                  Rp {summary?.totalValue.toLocaleString('id-ID')}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#4A2B11]/50">Ingredients</CardTitle>
              <Package className="h-4 w-4 text-[#4A2B11]" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : (
                <div className="text-xl font-bold text-[#4A2B11]">{summary?.totalCount}</div>
              )}
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-soft transition-colors", (summary?.lowStockCount ?? 0) > 0 ? "bg-[#F4A261]/10" : "bg-white")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#4A2B11]/50">Stock Alerts</CardTitle>
              <AlertTriangle className={cn("h-4 w-4", (summary?.lowStockCount ?? 0) > 0 ? "text-[#E55A1B]" : "text-[#4A2B11]/20")} />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : (
                <div className={cn("text-xl font-bold", (summary?.lowStockCount ?? 0) > 0 ? "text-[#E55A1B]" : "text-[#4A2B11]")}>
                  {summary?.lowStockCount}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none bg-white shadow-soft overflow-hidden">
            <CardHeader className="border-b border-[#4A2B11]/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#4A2B11]">Recent Sales</CardTitle>
                  <CardDescription>Latest transactions recorded</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-[#F4A261] hover:text-[#E55A1B] hover:bg-transparent px-0">
                  <Link to="/transactions">
                    Full History <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (summary?.recentSales.length ?? 0) > 0 ? (
                <div className="divide-y divide-[#4A2B11]/5">
                  {summary?.recentSales.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-[#FDF8F5]/50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#4A2B11]">{tx.recipeName}</p>
                        <p className="text-xs text-[#4A2B11]/50">
                          {new Date(tx.timestamp).toLocaleDateString()} • {tx.quantitySold} pcs
                        </p>
                      </div>
                      <span className="font-bold text-[#4A2B11]">
                        Rp {tx.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-[#4A2B11]/40">No sales yet.</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft overflow-hidden">
            <CardHeader className="border-b border-[#4A2B11]/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#4A2B11]">Low Stock Items</CardTitle>
                  <CardDescription>Order these soon to avoid production breaks</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-[#F4A261] hover:text-[#E55A1B] hover:bg-transparent px-0">
                  <Link to="/inventory">
                    Restock All <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (summary?.lowStock.length ?? 0) > 0 ? (
                <div className="divide-y divide-[#4A2B11]/5">
                  {summary?.lowStock.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-red-50/30">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#4A2B11]">{item.name}</p>
                        <p className="text-xs text-red-600 font-medium">
                          {item.stockQuantity}{item.unit} left (Min: {item.minimumStock})
                        </p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-[#4A2B11]/40">All levels healthy!</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}