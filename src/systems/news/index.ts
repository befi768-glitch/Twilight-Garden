import { NewsService } from '../../services/NewsService';
import { NewsItem } from '../../models/types';

export async function getOfflineSummary(guildId: string, since: Date): Promise<NewsItem[]> {
  return NewsService.getOfflineSummary(guildId, since);
}
