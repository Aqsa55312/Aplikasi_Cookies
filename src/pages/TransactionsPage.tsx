import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Recipe, Transaction, Ingredient } from '@shared/types';
import { Receipt, Plus, Search, Loader2, ArrowUpRight, History } from 'lucide-react';
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
  const transactions = useMemo(() => (transactionsData?.items ?? []).sort((a, b) => b.timestamp - a.timestamp), [transactionsData]);
  const selectedRecipe = useMemo(() => recipes.find(r => r.id === selectedRecipeId), [recipes, selectedRecipeId]);
  const estimatedPrice = useMemo(() => {
    if (!selectedRecipe || !ingredients.length) return 0;
    const rawCost = selectedRecipe.ingredients.reduce((sum, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      if (!ing) return sum;
      const multiplier = (ing.unit === 'g' || ing.unit === 'ml') ? 1000 : 1;
      return sum + (ing.pricePerUnit * (ri.quantity / multiplier));
    }, 0);
    const costPerPiece = (rawCost + selectedRecipe.laborCost + selectedRecipe.packagingCost) / selectedRecipe.yieldCount;
    return costPerPiece * (1 + selectedRecipe.markupPercentage / 100) * quantity;
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
      toast.success('Sale recorded successfully');
      setQuantity(1);
    },
    onError: (err) => toast.error(err.message)
  });
  const handleSale = () => {
    if (!selectedRecipeId) return toast.error('Please select a recipe');
    mutation.mutate({ recipeId: selectedRecipeId, quantitySold: quantity });
  };
  return (
    <AppLayout container className="bg-[#FDF8F5]">
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[#4A2B11]">Sales & Transactions</h1>
          <p className="text-[#4A2B11]/60">Record new sales and track revenue history.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-none bg-white shadow-soft h-fit">
            <CardHeader className="bg-[#4A2B11] text-white rounded-t-xl">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#F4A261]" /> New Sale
              </CardTitle>
              <CardDescription className="text-white/60">Select recipe and quantity</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Cookie Recipe</Label>
                <select 
                  className="w-full rounded-md border border-[#4A2B11]/10 bg-white p-2 text-sm h-10"
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                >
                  <option value="">Select a recipe...</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quantity Sold (pcs)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-white border-[#4A2B11]/10"
                />
              </div>
              {selectedRecipe && (
                <div className="p-4 rounded-xl bg-[#FDF8F5] border border-[#F4A261]/20 space-y-2">
                  <div className="flex justify-between text-xs text-[#4A2B11]/60">
                    <span>Price per piece</span>
                    <span>Rp {(estimatedPrice / quantity).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#4A2B11]">
                    <span>Total Price</span>
                    <span className="text-emerald-600">Rp {estimatedPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
              <Button 
                onClick={handleSale}
                disabled={mutation.isPending || !selectedRecipeId}
                className="w-full bg-[#F4A261] hover:bg-[#E55A1B] text-white shadow-md py-6 text-lg font-bold"
              >
                {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowUpRight className="mr-2 h-5 w-5" /> Record Sale</>}
              </Button>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-none bg-white shadow-soft">
            <CardHeader className="border-b border-[#4A2B11]/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#4A2B11]">Recent Sales</CardTitle>
                  <CardDescription>History of last transactions</CardDescription>
                </div>
                <History className="h-5 w-5 text-[#4A2B11]/20" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#FDF8F5]/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Date</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Recipe</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-[#4A2B11]/40 text-center">Qty</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-[#4A2B11]/40 text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTx ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="inline animate-spin h-5 w-5" /></TableCell></TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No sales recorded yet</TableCell></TableRow>
                    ) : (
                      transactions.map(tx => (
                        <TableRow key={tx.id} className="hover:bg-[#FDF8F5]/50 transition-colors">
                          <TableCell className="text-xs text-[#4A2B11]/60">
                            {new Date(tx.timestamp).toLocaleDateString('id-ID')}
                            <br />
                            <span className="text-[10px]">{new Date(tx.timestamp).toLocaleTimeString('id-ID')}</span>
                          </TableCell>
                          <TableCell className="font-medium text-[#4A2B11]">{tx.recipeName}</TableCell>
                          <TableCell className="text-center font-mono">{tx.quantitySold}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">Rp {tx.totalPrice.toLocaleString('id-ID')}</TableCell>
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
    </AppLayout>
  );
}