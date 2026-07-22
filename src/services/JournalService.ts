import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { JournalEntry } from '../models/types';
import { randomUUID } from 'crypto';

export class JournalService {
  static async getEntries(playerId: string, type?: string): Promise<JournalEntry[]> {
    const conditions = [eq(schema.journalEntries.playerId, playerId)];
    if (type) conditions.push(eq(schema.journalEntries.type, type));
    const result = await db.select().from(schema.journalEntries).where(and(...conditions));
    return result as unknown as JournalEntry[];
  }

  static async hasEntry(playerId: string, type: string, targetId: string): Promise<boolean> {
    const result = await db.select().from(schema.journalEntries)
      .where(and(eq(schema.journalEntries.playerId, playerId), eq(schema.journalEntries.type, type), eq(schema.journalEntries.targetId, targetId))).limit(1);
    return result.length > 0;
  }

  static async addEntry(playerId: string, type: string, targetId: string, title: string, content: string): Promise<boolean> {
    if (await JournalService.hasEntry(playerId, type, targetId)) return false;
    await db.insert(schema.journalEntries).values({ id: randomUUID(), playerId, type, targetId, title, content, discoveredAt: new Date() });
    return true;
  }

  static async getCount(playerId: string): Promise<number> {
    return (await JournalService.getEntries(playerId)).length;
  }
}
