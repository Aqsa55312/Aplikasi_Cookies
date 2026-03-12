import { Hono } from "hono";
import type { Env } from './core-utils';
import { IngredientEntity } from "./entities";
import { ok, bad, isStr } from './core-utils';
import type { Ingredient } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // INGREDIENTS
  app.get('/api/ingredients', async (c) => {
    await IngredientEntity.ensureSeed(c.env);
    const cursor = c.req.query('cursor');
    const limit = c.req.query('limit');
    const page = await IngredientEntity.list(
      c.env, 
      cursor ?? null, 
      limit ? Math.max(1, (Number(limit) | 0)) : undefined
    );
    return ok(c, page);
  });
  app.post('/api/ingredients', async (c) => {
    const data = (await c.req.json()) as Partial<Ingredient>;
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
  app.delete('/api/ingredients/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await IngredientEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  app.post('/api/ingredients/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await IngredientEntity.deleteMany(c.env, list) });
  });
}