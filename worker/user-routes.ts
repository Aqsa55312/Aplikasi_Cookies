import { Hono } from "hono";
import type { Env } from './core-utils';
import { IngredientEntity, RecipeEntity, TransactionEntity } from "./entities";
import { ok, bad, isStr } from './core-utils';
import type { Ingredient, Recipe, DashboardSummary, Transaction } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // DASHBOARD
  app.get('/api/dashboard', async (c) => {
    const { items: ingredients } = await IngredientEntity.list(c.env);
    const { items: transactions } = await TransactionEntity.list(c.env);
    const sortedTx = transactions.sort((a, b) => b.timestamp - a.timestamp);
    const recentSales = sortedTx.slice(0, 5);
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
    const totalCount = ingredients.length;
    const totalValue = ingredients.reduce((sum, item) => {
      const multiplier = (item.unit === 'g' || item.unit === 'ml') ? 1000 : 1;
      return sum + (item.pricePerUnit * (item.stockQuantity / multiplier));
    }, 0);
    const lowStock = ingredients.filter(i => i.stockQuantity <= i.minimumStock);
    const avgHPP = totalValue * 1.1; 
    const summary: DashboardSummary = {
      totalCount,
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
    await TransactionEntity.ensureSeed(c.env);
    const list = await TransactionEntity.list(c.env);
    return ok(c, list);
  });
  app.post('/api/transactions', async (c) => {
    const { recipeId, quantitySold } = await c.req.json() as { recipeId: string; quantitySold: number };
    if (!recipeId || !quantitySold) return bad(c, 'Recipe and quantity required');
    const recipeInst = new RecipeEntity(c.env, recipeId);
    if (!(await recipeInst.exists())) return bad(c, 'Recipe not found');
    const recipe = await recipeInst.getState();
    // Check stock for all ingredients
    const neededAmounts: Record<string, number> = {};
    for (const ri of recipe.ingredients) {
      const needed = (quantitySold / recipe.yieldCount) * ri.quantity;
      neededAmounts[ri.ingredientId] = needed;
    }
    const shortList: string[] = [];
    const ingredientEntities: IngredientEntity[] = [];
    for (const [ingId, amount] of Object.entries(neededAmounts)) {
      const ingEnt = new IngredientEntity(c.env, ingId);
      const s = await ingEnt.getState();
      if (s.stockQuantity < amount) {
        shortList.push(s.name);
      }
      ingredientEntities.push(ingEnt);
    }
    if (shortList.length > 0) {
      return bad(c, `Insufficient stock: ${shortList.join(', ')}`);
    }
    // Deduct stock and record transaction
    await Promise.all(ingredientEntities.map(async (ent) => {
      const amount = neededAmounts[ent.id];
      await ent.mutate(s => ({ ...s, stockQuantity: s.stockQuantity - amount }));
    }));
    // Calculate price
    const ingredientCost = recipe.ingredients.reduce((sum, item) => {
      const multiplier = 1000; // Simplified for seed logic g/ml
      // Real app would fetch each ingredient price, but for performance we use the state we just had
      return sum; 
    }, 0);
    // For this demo, we assume the price is sent or calculated from recipe metadata
    // Calculating raw ingredient costs again to get accurate totalPrice
    const ingredientsData = await Promise.all(recipe.ingredients.map(ri => new IngredientEntity(c.env, ri.ingredientId).getState()));
    const totalRawCost = recipe.ingredients.reduce((sum, ri, idx) => {
      const ing = ingredientsData[idx];
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
    const result = await TransactionEntity.create(c.env, transaction);
    return ok(c, result);
  });
  // INGREDIENTS
  app.get('/api/ingredients', async (c) => {
    await IngredientEntity.ensureSeed(c.env);
    const page = await IngredientEntity.list(c.env);
    return ok(c, page);
  });
  app.post('/api/ingredients', async (c) => {
    const data = await c.req.json() as Partial<Ingredient>;
    if (!data.name?.trim()) return bad(c, 'name required');
    const id = data.id || crypto.randomUUID();
    const ingredient: Ingredient = {
      id,
      name: data.name.trim(),
      pricePerUnit: Number(data.pricePerUnit) || 0,
      stockQuantity: Number(data.stockQuantity) || 0,
      minimumStock: Number(data.minimumStock) || 0,
      unit: data.unit || 'g'
    };
    return ok(c, await IngredientEntity.create(c.env, ingredient));
  });
  app.patch('/api/ingredients/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json();
    const inst = new IngredientEntity(c.env, id);
    if (!(await inst.exists())) return bad(c, 'not found');
    const updated = await inst.mutate(s => ({ ...s, ...data }));
    return ok(c, updated);
  });
  app.delete('/api/ingredients/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await IngredientEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // RECIPES
  app.get('/api/recipes', async (c) => {
    await RecipeEntity.ensureSeed(c.env);
    return ok(c, await RecipeEntity.list(c.env));
  });
  app.post('/api/recipes', async (c) => {
    const data = await c.req.json() as Recipe;
    if (!data.name) return bad(c, 'name required');
    const id = data.id || crypto.randomUUID();
    return ok(c, await RecipeEntity.create(c.env, { ...data, id }));
  });
  app.delete('/api/recipes/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { deleted: await RecipeEntity.delete(c.env, id) });
  });
}