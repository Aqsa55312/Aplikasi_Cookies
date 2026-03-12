import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import type { Ingredient, DashboardSummary } from '@shared/types';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calculator,
  Plus,
  Download
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
  const ingredients = useMemo(() => ingredientsData?.items ?? [], [ingredientsData]);
  const exportSummary = () => {
    if (!ingredients.length) return;
    const worksheet = XLSX.utils.json_to_sheet(ingredients.map(i => ({
      'Nama Bahan': i.name,
      'Harga per Unit (IDR)': i.pricePerUnit,
      'Stok Saat Ini': i.stockQuantity,
      'Satuan': i.unit,
      'Stok Minimum': i.minimumStock,
      'Total Nilai (IDR)': i.pricePerUnit * (i.stockQuantity / (i.unit === 'g' || i.unit === 'ml' ? 1000 : 1))
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `Bakery_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            <Button onClick={exportSummary} variant="outline" className="border-[#4A2B11]/10 bg-white text-[#4A2B11]">
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
            <Button asChild className="bg-[#F4A261] hover:bg-[#E55A1B] text-white shadow-md transition-transform active:scale-95">
              <Link to="/inventory">
                <Plus className="mr-2 h-4 w-4" /> Add Stock
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-white shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#4A2B11]/50">Total Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#F4A261]" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-[#4A2B11]">
                  Rp {summary?.totalValue.toLocaleString('id-ID')}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#4A2B11]/50">Unique Ingredients</CardTitle>
              <Package className="h-4 w-4 text-[#4A2B11]" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : (
                <div className="text-2xl font-bold text-[#4A2B11]">{summary?.totalCount}</div>
              )}
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-soft transition-colors", (summary?.lowStockCount ?? 0) > 0 ? "bg-[#F4A261]/10" : "bg-white")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#4A2B11]/50">Low Stock Alerts</CardTitle>
              <AlertTriangle className={cn("h-4 w-4", (summary?.lowStockCount ?? 0) > 0 ? "text-[#E55A1B]" : "text-[#4A2B11]/20")} />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : (
                <div className={cn("text-2xl font-bold", (summary?.lowStockCount ?? 0) > 0 ? "text-[#E55A1B]" : "text-[#4A2B11]")}>
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
                  <CardTitle className="text-lg text-[#4A2B11]">Urgent Restock</CardTitle>
                  <CardDescription>Items falling below minimum threshold</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-[#F4A261] hover:text-[#E55A1B] hover:bg-transparent px-0">
                  <Link to="/inventory">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
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
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-[#FDF8F5]/50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#4A2B11]">{item.name}</p>
                        <p className="text-xs text-[#4A2B11]/50">
                          Stock: {item.stockQuantity}{item.unit} / Min: {item.minimumStock}{item.unit}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-[#E55A1B]/10 px-2 py-1 text-[10px] font-bold text-[#E55A1B] uppercase tracking-wider">
                        Critical
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Package className="h-10 w-10 text-[#4A2B11]/10 mx-auto mb-3" />
                  <p className="text-sm text-[#4A2B11]/40">All stock levels are healthy.</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="border-none bg-[#4A2B11] text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator className="h-24 w-24 rotate-12" />
              </div>
              <CardHeader>
                <CardTitle className="text-white">Recipe Profitability</CardTitle>
                <CardDescription className="text-white/60">Estimated Business HPP: Rp {summary?.avgHPP.toLocaleString('id-ID')}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button asChild className="w-full bg-[#F4A261] hover:bg-[#F4A261]/90 text-white border-none">
                  <Link to="/calculator">Open HPP Calculator</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}