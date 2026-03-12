import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Ingredient, Recipe, RecipeIngredient } from '@shared/types';
import { Calculator, Plus, Trash2, Save, Scale, Info, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export function CalculatorPage() {
  const queryClient = useQueryClient();
  const [recipe, setRecipe] = useState<Partial<Recipe>>({
    name: 'New Recipe',
    ingredients: [],
    yieldCount: 10,
    laborCost: 0,
    packagingCost: 0,
    markupPercentage: 50
  });
  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api<{ items: Ingredient[] }>('/api/ingredients')
  });
  const ingredients = useMemo(() => ingredientsData?.items ?? [], [ingredientsData]);
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Recipe>) => api<Recipe>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe saved successfully');
    }
  });
  const addIngredient = () => {
    if (!ingredients.length) return;
    setRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ingredientId: ingredients[0].id, quantity: 100 }]
    }));
  };
  const removeIngredient = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
    }));
  };
  const updateIngredient = (index: number, updates: Partial<RecipeIngredient>) => {
    setRecipe(prev => {
      const newIngredients = [...(prev.ingredients || [])];
      newIngredients[index] = { ...newIngredients[index], ...updates };
      return { ...prev, ingredients: newIngredients };
    });
  };
  const costs = useMemo(() => {
    const ingredientCost = (recipe.ingredients || []).reduce((sum, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return sum;
      const multiplier = (ing.unit === 'g' || ing.unit === 'ml') ? 1000 : 1;
      return sum + (ing.pricePerUnit * (item.quantity / multiplier));
    }, 0);
    const totalRaw = ingredientCost + (recipe.laborCost || 0) + (recipe.packagingCost || 0);
    const costPerUnit = totalRaw / (recipe.yieldCount || 1);
    const suggestedRetail = costPerUnit * (1 + (recipe.markupPercentage || 0) / 100);
    return { totalRaw, costPerUnit, suggestedRetail };
  }, [recipe, ingredients]);
  return (
    <AppLayout container className="bg-[#FDF8F5]">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#4A2B11]">HPP Calculator</h1>
            <p className="text-[#4A2B11]/60">Calculate recipe costs and retail prices with precision.</p>
          </div>
          <Button onClick={() => saveMutation.mutate(recipe)} className="bg-[#4A2B11] hover:bg-[#4A2B11]/90 text-white shadow-md">
            <Save className="mr-2 h-4 w-4" /> Save Formula
          </Button>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none bg-white shadow-soft">
              <CardHeader className="border-b border-[#4A2B11]/5">
                <CardTitle className="text-[#4A2B11]">Recipe Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Recipe Name</Label>
                  <Input value={recipe.name} onChange={e => setRecipe(p => ({ ...p, name: e.target.value }))} className="bg-[#FDF8F5]/50" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#4A2B11]/60 font-bold uppercase text-[10px] tracking-widest">Ingredients List</Label>
                    <Button variant="ghost" size="sm" onClick={addIngredient} className="text-[#F4A261] hover:text-[#E55A1B] text-xs font-bold">
                      <Plus className="mr-1 h-3 w-3" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(recipe.ingredients || []).map((item, idx) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      return (
                        <div key={idx} className="flex gap-3 items-end p-3 rounded-lg bg-[#FDF8F5]/50 border border-[#4A2B11]/5 group">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[10px]">Ingredient</Label>
                            <select 
                              value={item.ingredientId} 
                              onChange={e => updateIngredient(idx, { ingredientId: e.target.value })}
                              className="w-full rounded-md border border-[#4A2B11]/10 bg-white p-2 text-sm h-9"
                            >
                              {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                            </select>
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className="text-[10px]">Quantity</Label>
                            <Input 
                              type="number" 
                              value={item.quantity} 
                              onChange={e => updateIngredient(idx, { quantity: Number(e.target.value) })}
                              className="bg-white h-9" 
                            />
                          </div>
                          <div className="w-24 text-right pb-2">
                            <p className="text-[10px] text-[#4A2B11]/40 uppercase font-bold">Cost</p>
                            <p className="text-xs font-semibold text-[#4A2B11]">
                              Rp {((ing?.pricePerUnit || 0) * (item.quantity / (ing?.unit === 'g' || ing?.unit === 'ml' ? 1000 : 1))).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeIngredient(idx)} className="h-9 w-9 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none bg-white shadow-soft">
                <CardContent className="pt-6">
                  <Label className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Batch Yield</Label>
                  <Input type="number" value={recipe.yieldCount} onChange={e => setRecipe(p => ({ ...p, yieldCount: Number(e.target.value) }))} className="mt-1" />
                  <p className="text-[10px] mt-2 text-[#4A2B11]/40 italic">Cookies/Pcs per batch</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-white shadow-soft">
                <CardContent className="pt-6">
                  <Label className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Labor Cost</Label>
                  <Input type="number" value={recipe.laborCost} onChange={e => setRecipe(p => ({ ...p, laborCost: Number(e.target.value) }))} className="mt-1" />
                </CardContent>
              </Card>
              <Card className="border-none bg-white shadow-soft">
                <CardContent className="pt-6">
                  <Label className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Markup %</Label>
                  <Input type="number" value={recipe.markupPercentage} onChange={e => setRecipe(p => ({ ...p, markupPercentage: Number(e.target.value) }))} className="mt-1" />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="border-none bg-[#4A2B11] text-white shadow-xl sticky top-24 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><PieChart className="h-32 w-32" /></div>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#F4A261]" /> Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Total Batch Cost</p>
                  <p className="text-2xl font-bold text-white">Rp {costs.totalRaw.toLocaleString('id-ID')}</p>
                </div>
                <div className="h-px bg-white/10" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Cost / Piece</p>
                    <p className="text-lg font-bold text-[#F4A261]">Rp {costs.costPerUnit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Retail Suggestion</p>
                    <p className="text-lg font-bold text-emerald-400">Rp {costs.suggestedRetail.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Info className="h-4 w-4 text-[#F4A261] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Based on your <strong>{recipe.markupPercentage}%</strong> target margin, each cookie should be sold for at least Rp {Math.ceil(costs.suggestedRetail / 500) * 500}.
                  </p>
                </div>
                <Button className="w-full bg-[#F4A261] hover:bg-[#E55A1B] text-white border-none h-12">
                  <Scale className="mr-2 h-4 w-4" /> Scale Batch Size
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}