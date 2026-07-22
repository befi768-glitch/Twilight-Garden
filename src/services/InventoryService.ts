import { eq, and, sql } from 'drizzle-orm';
import { db, schema } from '../database';
import { InventoryItem } from '../models/types';
import { randomUUID } from 'crypto';

export class InventoryService {
  static async getInventory(playerId: string): Promise<InventoryItem[]> {
    const result = await db.select().from(schema.inventory).where(eq(schema.inventory.playerId, playerId));
    return result as unknown as InventoryItem[];
  }

  static async getItem(playerId: string, itemId: string): Promise<InventoryItem | null> {
    const result = await db
      .select()
      .from(schema.inventory)
      .where(and(eq(schema.inventory.playerId, playerId), eq(schema.inventory.itemId, itemId)))
      .limit(1);
    return result.length > 0 ? (result[0] as unknown as InventoryItem) : null;
  }

  static async hasItem(playerId: string, itemId: string, quantity = 1): Promise<boolean> {
    const item = await InventoryService.getItem(playerId, itemId);
    return (item?.quantity ?? 0) >= quantity;
  }

  static async addItem(playerId: string, itemId: string, quantity: number, metadata?: Record<string, unknown>): Promise<void> {
    // FIX: wrap in transaction — prevents two concurrent addItem calls for a brand-new
    // item both seeing existing=null and both trying to INSERT (duplicate key crash)
    await db.transaction(async (tx) => {
      const result = await tx
        .select()
        .from(schema.inventory)
        .where(and(eq(schema.inventory.playerId, playerId), eq(schema.inventory.itemId, itemId)))
        .limit(1);

      if (result.length > 0) {
        // FIX: atomic SQL increment — avoids read-modify-write race condition
        await tx
          .update(schema.inventory)
          .set({ quantity: sql`${schema.inventory.quantity} + ${quantity}` })
          .where(and(eq(schema.inventory.playerId, playerId), eq(schema.inventory.itemId, itemId)));
      } else {
        await tx.insert(schema.inventory).values({
          id: randomUUID(),
          playerId,
          itemId,
          quantity,
          acquiredAt: new Date(),
          metadata: metadata ?? null,
        });
      }
    });
  }

  static async removeItem(playerId: string, itemId: string, quantity: number): Promise<void> {
    // FIX: wrap entire check+delete/update in a transaction so two concurrent removals
    // can't both pass the quantity check and then double-remove (race condition)
    await db.transaction(async (tx) => {
      const result = await tx
        .select()
        .from(schema.inventory)
        .where(and(eq(schema.inventory.playerId, playerId), eq(schema.inventory.itemId, itemId)))
        .limit(1);
      const existing = result.length > 0 ? (result[0] as unknown as InventoryItem) : null;
      if (!existing || existing.quantity < quantity) throw new Error('Not enough items');

      if (existing.quantity === quantity) {
        await tx
          .delete(schema.inventory)
          .where(and(eq(schema.inventory.playerId, playerId), eq(schema.inventory.itemId, itemId)));
      } else {
        // Atomic SQL decrement — avoids read-modify-write race condition
        await tx
          .update(schema.inventory)
          .set({ quantity: sql`${schema.inventory.quantity} - ${quantity}` })
          .where(and(eq(schema.inventory.playerId, playerId), eq(schema.inventory.itemId, itemId)));
      }
    });
  }

  static async clearInventory(playerId: string): Promise<void> {
    await db.delete(schema.inventory).where(eq(schema.inventory.playerId, playerId));
  }

  static async countItems(playerId: string): Promise<number> {
    const inv = await InventoryService.getInventory(playerId);
    return inv.reduce((sum, item) => sum + item.quantity, 0);
  }
}
