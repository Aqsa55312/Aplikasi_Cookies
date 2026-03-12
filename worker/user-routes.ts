import { Hono } from "hono";
import type { Env } from './core-utils';
import { IngredientEntity, RecipeEntity } from "./entities";
import { ok, bad, isStr } from './core-utils';
import type { Ingredient, Recipe, DashboardSummary } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // DASHBOARD
  app.get('/api/dashboard', async (c) => {
    const { items: ingredients } = await IngredientEntity.list(c.env);
    const totalCount = ingredients.length;
    const totalValue = ingredients.reduce((sum, item) => {
      // Logic: Price is per Kg or per Unit. If unit is g/ml, divide stock by 1000
      const multiplier = (item.unit === 'g' || item.unit === 'ml') ? 1000 : 1;
      return sum + (item.pricePerUnit * (item.stockQuantity / multiplier));
    }, 0);
    const lowStock = ingredients.filter(i => i.stockQuantity <= i.minimumStock);
    const avgHPP = totalValue * 1.1; // Business overhead 10%
    const summary: DashboardSummary = {
      totalCount,
      totalValue,
      lowStockCount: lowStock.length,
      lowStock,
      avgHPP
    };
    return ok(c, summary);
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
  app.post('/api/ingredients/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    return ok(c, { deletedCount: await IngredientEntity.deleteMany(c.env, list) });
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