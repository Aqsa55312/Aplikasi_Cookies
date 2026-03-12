import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Recipe, Transaction, Ingredient } from '@shared/types';
import {
  Search,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  PackageSearch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [search, setSearch] = useState('');
  const { data: recipesData, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api<{ items: Recipe[] }>('/api/recipes')
  });
  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api<{ items: Ingredient[] }>('/api/ingredients')
  });
  const { data: transactionsData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api<{ items: Transaction[] }>('/api/transactions')
  });
  const recipes = useMemo(() => recipesData?.items ?? [], [recipesData]);
  const ingredients = useMemo(() => ingredientsData?.items ?? [], [ingredientsData]);
  const transactions = useMemo(() => 
    (transactionsData?.items ?? [])
      .filter(tx => tx.recipeName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp), 
    [transactionsData, search]
  );
  const selectedRecipe = useMemo(() => recipes.find(r => r.id === selectedRecipeId), [recipes, selectedRecipeId]);
  const financialStats = useMemo(() => {
    if (!selectedRecipe || !ingredients.length) return { revenue: 0, cost: 0, profit: 0 };
    const rawCost = selectedRecipe.ingredients.reduce((sum, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      if (!ing) return sum;
      const multiplier = (ing.unit === 'g' || ing.unit === 'ml') ? 1000 : 1;
      return sum + (ing.pricePerUnit * (ri.quantity / multiplier));
    }, 0);
    const costPerPiece = (rawCost + selectedRecipe.laborCost + selectedRecipe.packagingCost) / selectedRecipe.yieldCount;
    const pricePerPiece = costPerPiece * (1 + selectedRecipe.markupPercentage / 100);
    const totalRevenue = pricePerPiece * quantity;
    const totalCost = costPerPiece * quantity;
    return { 
      revenue: totalRevenue, 
      cost: totalCost, 
      profit: totalRevenue - totalCost 
    };
  }, [selectedRecipe, ingredients, quantity]);
  const mutation = useMutation({
    mutationFn: (payload: { recipeId: string; quantitySold: number }) =>
      api<Transaction>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Sale successfully recorded and stock deducted');
      setQuantity(1);
    },
    onError: (err) => {
      toast.error(err.message, {
        action: {
          label: 'Check Inventory',
          onClick: () => window.location.href = '/inventory'
        }
      });
    }
  });
  const handleSale = () => {
    if (!selectedRecipeId) return toast.error('Please select a recipe');
    mutation.mutate({ recipeId: selectedRecipeId, quantitySold: quantity });
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#4A2B11]">Sales & Revenue</h1>
        <p className="text-[#4A2B11]/60">Document sales and monitor transaction performance.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-none bg-white shadow-soft h-fit overflow-hidden rounded-2xl">
          <CardHeader className="bg-[#4A2B11] text-white">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#F4A261]" />
              <CardTitle className="text-lg">Checkout</CardTitle>
            </div>
            <CardDescription className="text-white/40">Select products for recording</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select Cookie</Label>
              <select
                className="w-full rounded-xl border border-[#4A2B11]/10 bg-white p-3 text-sm h-12 outline-none focus:ring-2 focus:ring-[#F4A261]/20 transition-all"
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
              >
                <option value="">Choose a recipe...</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Quantity (Units)</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="bg-white border-[#4A2B11]/10 h-12 rounded-xl"
              />
            </div>
            {selectedRecipe && (
              <div className="p-5 rounded-2xl bg-[#FDF8F5] border border-[#F4A261]/10 space-y-4 animate-scale-in">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#4A2B11]/50 font-medium">
                    <span>Total Revenue</span>
                    <span className="font-bold text-[#4A2B11]">Rp {financialStats.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#4A2B11]/50 font-medium">
                    <span>Production Cost</span>
                    <span className="text-[#4A2B11]">Rp {financialStats.cost.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="h-px bg-[#4A2B11]/5" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-tighter text-[#4A2B11]/40">Projected Profit</span>
                  <span className="text-xl font-black text-emerald-600">Rp {financialStats.profit.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
            <Button
              onClick={handleSale}
              disabled={mutation.isPending || !selectedRecipeId}
              className="w-full bg-[#F4A261] hover:bg-[#E55A1B] text-white shadow-lg py-7 text-lg font-black rounded-xl transition-all active:scale-95"
            >
              {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowUpRight className="mr-2 h-6 w-6" /> Complete Sale</>}
            </Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-none bg-white shadow-soft rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#4A2B11]/5 bg-[#FDF8F5]/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-[#4A2B11]">Transaction History</CardTitle>
              <CardDescription>Filter and review past performance</CardDescription>
            </div>
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A2B11]/30" />
              <Input
                placeholder="Filter recipes..."
                className="pl-9 bg-white border-[#4A2B11]/10 rounded-full h-9 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#FDF8F5]/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] uppercase font-black text-[#4A2B11]/40 tracking-widest pl-6">Timestamp</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-[#4A2B11]/40 tracking-widest">Formula</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-[#4A2B11]/40 tracking-widest text-center">Qty</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-[#4A2B11]/40 tracking-widest text-right pr-6">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTx ? (
                    <TableRow><TableCell colSpan={4} className="h-48 text-center"><Loader2 className="inline animate-spin h-6 w-6 text-[#F4A261]" /></TableCell></TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                        <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <p className="font-medium">No sales recorded with current filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(tx => (
                      <TableRow key={tx.id} className="hover:bg-[#FDF8F5]/50 transition-colors border-[#4A2B11]/5">
                        <TableCell className="pl-6">
                          <div className="text-xs font-bold text-[#4A2B11]">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-[#4A2B11]/40 uppercase font-medium">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-[#4A2B11]">{tx.recipeName}</TableCell>
                        <TableCell className="text-center font-mono font-black text-sm">{tx.quantitySold}</TableCell>
                        <TableCell className="text-right pr-6 font-black text-emerald-600">
                          Rp {tx.totalPrice.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}