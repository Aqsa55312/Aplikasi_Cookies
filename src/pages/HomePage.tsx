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
  Plus,
  Download,
  Banknote,
  Receipt,
  PieChart as PieIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
export function HomePage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api<DashboardSummary>('/api/dashboard')
  });
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api<{ items: Transaction[] }>('/api/transactions')
  });
  const transactions = useMemo(() => transactionsData?.items ?? [], [transactionsData]);
  // Chart Data: Revenue Trend (Last 7 Days)
  const revenueTrend = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const dailyRevenue: Record<string, number> = {};
    transactions.forEach(tx => {
      const day = new Date(tx.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      dailyRevenue[day] = (dailyRevenue[day] || 0) + tx.totalPrice;
    });
    return days.map(day => ({ name: day, revenue: dailyRevenue[day] || 0 }));
  }, [transactions]);
  // Chart Data: Stock Value Distribution (Simplified Category)
  const COLORS = ['#4A2B11', '#F4A261', '#E55A1B', '#D14615'];
  const stockDistribution = [
    { name: 'Flours', value: 30 },
    { name: 'Dairy', value: 45 },
    { name: 'Chocolate', value: 15 },
    { name: 'Others', value: 10 },
  ];
  const exportReport = () => {
    if (!summary) return;
    const workbook = XLSX.utils.book_new();
    const salesData = transactions.map(t => ({
      'ID': t.id,
      'Recipe': t.recipeName,
      'Qty': t.quantitySold,
      'Revenue': t.totalPrice,
      'Date': new Date(t.timestamp).toLocaleString()
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesData), "Sales History");
    XLSX.writeFile(workbook, `Bakery_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  return (
    <AppLayout container className="bg-[#FDF8F5]">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#4A2B11]">Bakery Dashboard</h1>
            <p className="text-[#4A2B11]/60">Kitchen health and performance at a glance.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportReport} variant="outline" className="border-[#4A2B11]/10 bg-white text-[#4A2B11] hover:bg-white/80">
              <Download className="mr-2 h-4 w-4" /> Export Stats
            </Button>
            <Button asChild className="bg-[#4A2B11] hover:bg-[#4A2B11]/90 text-white shadow-lg transition-transform active:scale-95 px-6">
              <Link to="/transactions">
                <Plus className="mr-2 h-4 w-4" /> New Sale
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none bg-white shadow-soft rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#4A2B11]/40">Revenue</CardTitle>
              <Banknote className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-[#4A2B11]">
                  Rp {summary?.totalRevenue.toLocaleString('id-ID')}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#4A2B11]/40">Inv. Value</CardTitle>
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
          <Card className="border-none bg-white shadow-soft rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#4A2B11]/40">Avg. HPP</CardTitle>
              <Receipt className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : (
                <div className="text-2xl font-bold text-[#4A2B11]">
                  Rp {Math.round(summary?.avgHPP || 0).toLocaleString('id-ID')}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-soft rounded-2xl transition-all", (summary?.lowStockCount ?? 0) > 0 ? "bg-[#E55A1B]/10 ring-1 ring-[#E55A1B]/20" : "bg-white")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#4A2B11]/40">Alerts</CardTitle>
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
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-none bg-white shadow-soft rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#4A2B11]/5">
              <CardTitle className="text-lg text-[#4A2B11]">Revenue Trend</CardTitle>
              <CardDescription>Daily performance for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F4A261" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#F4A261" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4A2B1108" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A2B1180', fontSize: 12}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#F4A261" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#4A2B11]/5">
              <CardTitle className="text-lg text-[#4A2B11]">Stock Mix</CardTitle>
              <CardDescription>Value distribution by group</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-8">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {stockDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                {stockDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                    <span className="text-xs text-muted-foreground font-medium">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none bg-white shadow-soft rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#4A2B11]/5 bg-[#FDF8F5]/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#4A2B11]">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-[#F4A261] hover:text-[#E55A1B] font-bold">
                  <Link to="/transactions">History <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {summary?.recentSales.length ? (
                <div className="divide-y divide-[#4A2B11]/5">
                  {summary.recentSales.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-[#FDF8F5]/50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#4A2B11]">{tx.recipeName}</p>
                        <p className="text-[10px] text-[#4A2B11]/40 uppercase tracking-wider font-medium">
                          {new Date(tx.timestamp).toLocaleDateString()} • {tx.quantitySold} units
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600">
                        +Rp {tx.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center text-[#4A2B11]/30 italic">No sales activity yet.</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-soft rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#4A2B11]/5 bg-[#FDF8F5]/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#4A2B11]">Pantry Alerts</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-[#F4A261] hover:text-[#E55A1B] font-bold">
                  <Link to="/inventory">Inventory <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {summary?.lowStock.length ? (
                <div className="divide-y divide-[#4A2B11]/5">
                  {summary.lowStock.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-[#E55A1B]/5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#4A2B11]">{item.name}</p>
                        <p className="text-[10px] text-[#E55A1B] font-black uppercase tracking-widest">
                          {item.stockQuantity}{item.unit} (THRESHOLD: {item.minimumStock})
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-[#E55A1B]/10 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-[#E55A1B]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center text-emerald-500/40 italic font-medium">All ingredients fully stocked!</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}