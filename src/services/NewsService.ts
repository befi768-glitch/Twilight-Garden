import { eq, and, desc, gt } from 'drizzle-orm';
import { db, schema } from '../database';
import { NewsItem } from '../models/types';
import { randomUUID } from 'crypto';

export class NewsService {
  static async getLatestNews(guildId: string, limit = 5): Promise<NewsItem[]> {
    const result = await db.select().from(schema.news)
      .where(and(eq(schema.news.guildId, guildId), gt(schema.news.expiresAt, new Date())))
      .orderBy(desc(schema.news.createdAt))
      .limit(limit);
    return result as unknown as NewsItem[];
  }

  static async postNews(guildId: string, title: string, content: string, type: NewsItem['type'], importance: 1 | 2 | 3 = 1, expiresInHours = 24): Promise<void> {
    await db.insert(schema.news).values({
      id: randomUUID(), guildId, title, content, type, importance,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000),
    });
  }

  static async getOfflineSummary(guildId: string, since: Date): Promise<NewsItem[]> {
    const { gt, and, eq } = await import('drizzle-orm');
    const result = await db.select().from(schema.news)
      .where(and(eq(schema.news.guildId, guildId), gt(schema.news.createdAt, since)))
      .orderBy(desc(schema.news.importance))
      .limit(10);
    return result as unknown as NewsItem[];
  }
}
