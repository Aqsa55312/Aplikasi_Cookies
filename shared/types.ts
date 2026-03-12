export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'unit' | 'pack';
export interface Ingredient {
  id: string;
  name: string;
  pricePerUnit: number; // Cost in currency (typically per kg or per unit)
  stockQuantity: number; // Current stock in the base unit (g, ml, unit)
  minimumStock: number; // Low stock threshold
  unit: UnitType;
}
export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // Amount needed for the recipe in base units
}
export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  yieldCount: number; // How many cookies/batches this makes
  laborCost: number;
  packagingCost: number;
  markupPercentage: number;
}
export interface DashboardSummary {
  totalCount: number;
  totalValue: number;
  lowStockCount: number;
  lowStock: Ingredient[];
  avgHPP: number; // Estimated business HPP including overhead
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}