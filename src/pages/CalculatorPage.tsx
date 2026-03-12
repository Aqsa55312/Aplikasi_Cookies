import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Ingredient, Recipe, RecipeIngredient } from '@shared/types';
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  Scale,
  Info,
  PieChart,
  RotateCcw,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from '@/components/ui/sheet';
import { toast } from 'sonner';
const INITIAL_RECIPE: Partial<Recipe> = {
  name: 'New Recipe',
  ingredients: [],
  yieldCount: 10,
  laborCost: 0,
  packagingCost: 0,
  markupPercentage: 50
};
export function CalculatorPage() {
  const queryClient = useQueryClient();
  const [recipe, setRecipe] = useState<Partial<Recipe>>(INITIAL_RECIPE);
  const [isRecipeListOpen, setIsRecipeListOpen] = useState(false);
  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api<{ items: Ingredient[] }>('/api/ingredients')
  });
  const { data: recipesData } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api<{ items: Recipe[] }>('/api/recipes')
  });
  const ingredients = useMemo(() => ingredientsData?.items ?? [], [ingredientsData]);
  const savedRecipes = useMemo(() => recipesData?.items ?? [], [recipesData]);
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Recipe>) => api<Recipe>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setRecipe(saved);
      toast.success('Recipe formula saved');
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
  const loadRecipe = (r: Recipe) => {
    setRecipe(r);
    setIsRecipeListOpen(false);
    toast.info(`Loaded: ${r.name}`);
  };
  const resetBuilder = () => {
    setRecipe(INITIAL_RECIPE);
    toast.success('Builder reset');
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#4A2B11]">HPP Calculator</h1>
          <p className="text-[#4A2B11]/60">Refine your formulas and ensure profitability.</p>
        </div>
        <div className="flex gap-2">
          <Sheet open={isRecipeListOpen} onOpenChange={setIsRecipeListOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-[#4A2B11]/10 bg-white text-[#4A2B11]">
                <BookOpen className="mr-2 h-4 w-4" /> Formulas
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#FDF8F5]">
              <SheetHeader>
                <SheetTitle>Saved Recipes</SheetTitle>
                <SheetDescription>Select a formula to load into the builder.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {savedRecipes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No saved recipes yet.</div>
                ) : (
                  savedRecipes.map(r => (
                    <button
                      key={r.id}
                      onClick={() => loadRecipe(r)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-[#4A2B11]/5 rounded-xl hover:border-[#F4A261] transition-all group"
                    >
                      <div className="text-left">
                        <p className="font-bold text-[#4A2B11]">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.ingredients.length} items • Yields {r.yieldCount}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#F4A261]" />
                    </button>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" onClick={resetBuilder} className="text-[#4A2B11]/60 hover:text-[#4A2B11]">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={() => saveMutation.mutate(recipe)} className="bg-[#4A2B11] hover:bg-[#4A2B11]/90 text-white shadow-md">
            <Save className="mr-2 h-4 w-4" /> {recipe.id ? 'Update' : 'Save'} Formula
          </Button>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-white shadow-soft">
            <CardHeader className="border-b border-[#4A2B11]/5">
              <CardTitle className="text-[#4A2B11]">Composition Builder</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Recipe Name</Label>
                <Input
                  value={recipe.name}
                  onChange={e => setRecipe(p => ({ ...p, name: e.target.value }))}
                  className="bg-[#FDF8F5]/50 border-[#4A2B11]/10 text-lg font-semibold"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#4A2B11]/5 pb-2">
                  <Label className="text-[#4A2B11]/60 font-bold uppercase text-[10px] tracking-widest">Ingredients</Label>
                  <Button variant="ghost" size="sm" onClick={addIngredient} className="text-[#F4A261] hover:text-[#E55A1B] text-xs font-bold px-0 h-auto">
                    <Plus className="mr-1 h-3 w-3" /> Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {(recipe.ingredients || []).map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    return (
                      <div key={idx} className="flex gap-3 items-end p-4 rounded-xl bg-[#FDF8F5]/30 border border-[#4A2B11]/5 group hover:bg-[#FDF8F5]/60 transition-colors">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] text-[#4A2B11]/50 font-bold">Item</Label>
                          <select
                            value={item.ingredientId}
                            onChange={e => updateIngredient(idx, { ingredientId: e.target.value })}
                            className="w-full rounded-lg border border-[#4A2B11]/10 bg-white p-2 text-sm h-10 focus:ring-1 focus:ring-[#F4A261] outline-none"
                          >
                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                          </select>
                        </div>
                        <div className="w-28 space-y-1">
                          <Label className="text-[10px] text-[#4A2B11]/50 font-bold">Qty ({ing?.unit})</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateIngredient(idx, { quantity: Number(e.target.value) })}
                            className="bg-white h-10 border-[#4A2B11]/10"
                          />
                        </div>
                        <div className="w-24 text-right pb-2.5">
                          <p className="text-[10px] text-[#4A2B11]/30 uppercase font-black">Cost</p>
                          <p className="text-sm font-bold text-[#4A2B11]">
                            Rp {((ing?.pricePerUnit || 0) * (item.quantity / (ing?.unit === 'g' || ing?.unit === 'ml' ? 1000 : 1))).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(idx)}
                          className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none bg-white shadow-soft">
              <CardContent className="pt-6">
                <Label className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Yield / Batch</Label>
                <Input type="number" value={recipe.yieldCount} onChange={e => setRecipe(p => ({ ...p, yieldCount: Number(e.target.value) }))} className="mt-1 border-[#4A2B11]/10" />
              </CardContent>
            </Card>
            <Card className="border-none bg-white shadow-soft">
              <CardContent className="pt-6">
                <Label className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Labor Cost</Label>
                <Input type="number" value={recipe.laborCost} onChange={e => setRecipe(p => ({ ...p, laborCost: Number(e.target.value) }))} className="mt-1 border-[#4A2B11]/10" />
              </CardContent>
            </Card>
            <Card className="border-none bg-white shadow-soft">
              <CardContent className="pt-6">
                <Label className="text-[10px] uppercase font-bold text-[#4A2B11]/40">Markup %</Label>
                <Input type="number" value={recipe.markupPercentage} onChange={e => setRecipe(p => ({ ...p, markupPercentage: Number(e.target.value) }))} className="mt-1 border-[#4A2B11]/10" />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="border-none bg-[#4A2B11] text-white shadow-xl sticky top-24 overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart className="h-32 w-32" /></div>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#F4A261]" /> Financial Analysis
              </CardTitle>
              <CardDescription className="text-white/40">Real-time HPP calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Total Batch Cost</p>
                <p className="text-3xl font-bold text-white">Rp {costs.totalRaw.toLocaleString('id-ID')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Cost / Pcs</p>
                  <p className="text-xl font-bold text-[#F4A261]">Rp {costs.costPerUnit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="space-y-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Retail Target</p>
                  <p className="text-xl font-bold text-emerald-400">Rp {costs.suggestedRetail.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                <Info className="h-4 w-4 text-[#F4A261] shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">
                  With a <strong>{recipe.markupPercentage}%</strong> markup, you gain <strong>Rp {(costs.suggestedRetail - costs.costPerUnit).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</strong> profit per cookie.
                </p>
              </div>
              <Button className="w-full bg-[#F4A261] hover:bg-[#E55A1B] text-white border-none h-14 text-lg font-bold shadow-lg transition-transform active:scale-95">
                <Scale className="mr-2 h-5 w-5" /> Calculate Scale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}