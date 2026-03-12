import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Ingredient, UnitType } from '@shared/types';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  ArrowUpDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
export function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const { data: ingredientsPage, isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api<{ items: Ingredient[] }>('/api/ingredients')
  });
  const ingredients = ingredientsPage?.items ?? [];
  const mutation = useMutation({
    mutationFn: (data: Partial<Ingredient>) => api<Ingredient>('/api/ingredients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success(editingIngredient ? 'Ingredient updated' : 'Ingredient added');
      setIsSheetOpen(false);
      setEditingIngredient(null);
    },
    onError: (err) => toast.error('Action failed: ' + err.message)
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/ingredients/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success('Ingredient deleted');
    }
  });
  const filtered = ingredients.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const handleEdit = (item: Ingredient) => {
    setEditingIngredient(item);
    setIsSheetOpen(true);
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingIngredient?.id,
      name: formData.get('name') as string,
      unit: formData.get('unit') as UnitType,
      pricePerUnit: Number(formData.get('pricePerUnit')),
      stockQuantity: Number(formData.get('stockQuantity')),
      minimumStock: Number(formData.get('minimumStock')),
    };
    mutation.mutate(data);
  };
  return (
    <AppLayout container className="bg-[#FDF8F5]">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#4A2B11]">Pantry Inventory</h1>
            <p className="text-[#4A2B11]/60">Manage your raw materials and track stock levels.</p>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setEditingIngredient(null)} className="bg-[#4A2B11] hover:bg-[#4A2B11]/90 text-white shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[450px] bg-[#FDF8F5]">
              <SheetHeader>
                <SheetTitle className="text-[#4A2B11]">{editingIngredient ? 'Edit Ingredient' : 'New Ingredient'}</SheetTitle>
                <SheetDescription>Enter details for your bakery item.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input id="name" name="name" defaultValue={editingIngredient?.name} required placeholder="e.g. Pistachio Paste" className="bg-white border-[#4A2B11]/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <select id="unit" name="unit" defaultValue={editingIngredient?.unit || 'g'} className="w-full rounded-md border border-[#4A2B11]/10 bg-white p-2 text-sm">
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="l">Liters (l)</option>
                        <option value="unit">Units (ea)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerUnit">Price per Unit (Rp)</Label>
                      <Input id="pricePerUnit" name="pricePerUnit" type="number" defaultValue={editingIngredient?.pricePerUnit} required placeholder="150000" className="bg-white border-[#4A2B11]/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Initial Stock</Label>
                      <Input id="stockQuantity" name="stockQuantity" type="number" defaultValue={editingIngredient?.stockQuantity} required placeholder="1000" className="bg-white border-[#4A2B11]/10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumStock">Min. Stock Alert</Label>
                      <Input id="minimumStock" name="minimumStock" type="number" defaultValue={editingIngredient?.minimumStock} required placeholder="500" className="bg-white border-[#4A2B11]/10" />
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={mutation.isPending} className="w-full bg-[#F4A261] hover:bg-[#E55A1B] text-white">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-[#4A2B11]/5">
          <div className="p-4 border-b border-[#4A2B11]/5 bg-[#FDF8F5]/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A2B11]/40" />
              <Input 
                placeholder="Search ingredients..." 
                className="pl-10 bg-white border-[#4A2B11]/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#FDF8F5]/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] text-[#4A2B11]/60 font-semibold uppercase text-[11px] tracking-wider">Ingredient Name</TableHead>
                  <TableHead className="text-[#4A2B11]/60 font-semibold uppercase text-[11px] tracking-wider text-right">Unit Price</TableHead>
                  <TableHead className="text-[#4A2B11]/60 font-semibold uppercase text-[11px] tracking-wider text-center">Stock Level</TableHead>
                  <TableHead className="text-[#4A2B11]/60 font-semibold uppercase text-[11px] tracking-wider">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-[#4A2B11]/40">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading pantry...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-[#4A2B11]/40">
                        <Search className="h-8 w-8 mb-2" />
                        <p>No ingredients found matching "{search}"</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => {
                    const isLow = item.stockQuantity <= item.minimumStock;
                    return (
                      <TableRow key={item.id} className="hover:bg-[#FDF8F5]/80 transition-colors group">
                        <TableCell className="font-medium text-[#4A2B11]">{item.name}</TableCell>
                        <TableCell className="text-right text-[#4A2B11]/80">Rp {item.pricePerUnit.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-center font-mono text-[#4A2B11]">
                          {item.stockQuantity} <span className="text-[10px] text-[#4A2B11]/40">{item.unit}</span>
                        </TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="outline" className="bg-[#E55A1B]/5 border-[#E55A1B]/20 text-[#E55A1B] font-bold text-[10px] uppercase">
                              <AlertCircle className="mr-1 h-3 w-3" /> Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-600 font-bold text-[10px] uppercase">
                              Healthy
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer">
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteMutation.mutate(item.id)}
                                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}