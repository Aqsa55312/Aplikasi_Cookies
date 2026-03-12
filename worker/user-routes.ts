import { Hono } from "hono";
import type { Env } from './core-utils';
import { IngredientEntity, RecipeEntity, TransactionEntity } from "./entities";
import { ok, bad, isStr, notFound } from './core-utils';
import type { Ingredient, Recipe, DashboardSummary, Transaction } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // DASHBOARD
  app.get('/api/dashboard', async (c) => {
    const { items: ingredients } = await IngredientEntity.list(c.env);
    const { items: transactions } = await TransactionEntity.list(c.env);
    const { items: recipes } = await RecipeEntity.list(c.env);
    const sortedTx = transactions.sort((a, b) => b.timestamp - a.timestamp);
    const recentSales = sortedTx.slice(0, 5);
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
    // Calculate total inventory value correctly
    const totalValue = ingredients.reduce((sum, item) => {
      const multiplier = (item.unit === 'g' || item.unit === 'ml') ? 1000 : 1;
      return sum + (item.pricePerUnit * (item.stockQuantity / multiplier));
    }, 0);
    const lowStock = ingredients.filter(i => i.stockQuantity <= i.minimumStock);
    // Accurate Average HPP (Cost per Unit) calculation across all recipes
    let totalHppSum = 0;
    if (recipes.length > 0) {
      recipes.forEach(recipe => {
        const recipeIngCost = recipe.ingredients.reduce((sum, ri) => {
          const ing = ingredients.find(i => i.id === ri.ingredientId);
          if (!ing) return sum;
          const multiplier = (ing.unit === 'g' || ing.unit === 'ml') ? 1000 : 1;
          return sum + (ing.pricePerUnit * (ri.quantity / multiplier));
        }, 0);
        const costPerUnit = (recipeIngCost + recipe.laborCost + recipe.packagingCost) / (recipe.yieldCount || 1);
        totalHppSum += costPerUnit;
      });
    }
    const avgHPP = recipes.length > 0 ? totalHppSum / recipes.length : 0;
    const summary: DashboardSummary = {
      totalCount: ingredients.length,
      totalValue,
      lowStockCount: lowStock.length,
      lowStock,
      avgHPP,
      totalRevenue,
      recentSales
    };
    return ok(c, summary);
  });
  // TRANSACTIONS
  app.get('/api/transactions', async (c) => {
    const list = await TransactionEntity.list(c.env);
    return ok(c, list);
  });
  app.post('/api/transactions', async (c) => {
    const { recipeId, quantitySold } = await c.req.json() as { recipeId: string; quantitySold: number };
    if (!recipeId || !quantitySold) return bad(c, 'Recipe and quantity required');
    const recipeInst = new RecipeEntity(c.env, recipeId);
    if (!(await recipeInst.exists())) return bad(c, 'Recipe not found');
    const recipe = await recipeInst.getState();
    // Fetch required ingredients for stock check
    const { items: allIngredients } = await IngredientEntity.list(c.env);
    const neededAmounts: Record<string, number> = {};
    const shortList: string[] = [];
    for (const ri of recipe.ingredients) {
      const needed = (quantitySold / recipe.yieldCount) * ri.quantity;
      const ing = allIngredients.find(i => i.id === ri.ingredientId);
      if (!ing || ing.stockQuantity < needed) {
        shortList.push(ing?.name || 'Unknown Ingredient');
      }
      neededAmounts[ri.ingredientId] = needed;
    }
    if (shortList.length > 0) {
      return bad(c, `Insufficient stock: ${shortList.join(', ')}`);
    }
    // Atomic Deduct Stock
    await Promise.all(Object.entries(neededAmounts).map(async ([ingId, amount]) => {
      const ent = new IngredientEntity(c.env, ingId);
      await ent.mutate(s => ({ ...s, stockQuantity: Math.max(0, s.stockQuantity - amount) }));
    }));
    // Calculate Final Price
    const totalRawCost = recipe.ingredients.reduce((sum, ri) => {
      const ing = allIngredients.find(i => i.id === ri.ingredientId);
      if (!ing) return sum;
      const multiplier = (ing.unit === 'g' || ing.unit === 'ml') ? 1000 : 1;
      return sum + (ing.pricePerUnit * (ri.quantity / multiplier));
    }, 0);
    const costPerPiece = (totalRawCost + recipe.laborCost + recipe.packagingCost) / recipe.yieldCount;
    const pricePerPiece = costPerPiece * (1 + recipe.markupPercentage / 100);
    const totalPrice = pricePerPiece * quantitySold;
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      recipeId,
      recipeName: recipe.name,
      quantitySold,
      totalPrice,
      timestamp: Date.now()
    };
    await TransactionEntity.create(c.env, transaction);
    return ok(c, transaction);
  });
  // INGREDIENTS
  app.get('/api/ingredients', async (c) => {
    await IngredientEntity.ensureSeed(c.env);
    return ok(c, await IngredientEntity.list(c.env));
  });
  app.post('/api/ingredients', async (c) => {
    const data = await c.req.json() as Partial<Ingredient>;
    if (!data.name?.trim()) return bad(c, 'name required');
    const ingredient: Ingredient = {
      id: data.id || crypto.randomUUID(),
      name: data.name.trim(),
      pricePerUnit: Number(data.pricePerUnit) || 0,
      stockQuantity: Number(data.stockQuantity) || 0,
      minimumStock: Number(data.minimumStock) || 0,
      unit: data.unit || 'g'
    };
    return ok(c, await IngredientEntity.create(c.env, ingredient));
  });
  app.delete('/api/ingredients/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await IngredientEntity.delete(c.env, id) });
  });
  // RECIPES
  app.get('/api/recipes', async (c) => {
    await RecipeEntity.ensureSeed(c.env);
    return ok(c, await RecipeEntity.list(c.env));
  });
  app.get('/api/recipes/:id', async (c) => {
    const inst = new RecipeEntity(c.env, c.req.param('id'));
    if (!(await inst.exists())) return notFound(c);
    return ok(c, await inst.getState());
  });
  app.post('/api/recipes', async (c) => {
    const data = await c.req.json() as Recipe;
    if (!data.name) return bad(c, 'name required');
    const id = data.id || crypto.randomUUID();
    return ok(c, await RecipeEntity.create(c.env, { ...data, id }));
  });
  app.delete('/api/recipes/:id', async (c) => {
    return ok(c, { deleted: await RecipeEntity.delete(c.env, c.req.param('id')) });
  });
}