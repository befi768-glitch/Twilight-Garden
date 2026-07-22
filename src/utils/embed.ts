import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { rarityColors } from './helpers';

/** Create a standard themed embed */
export function createEmbed(options: {
  title?: string;
  description?: string;
  color?: ColorResolvable | number;
  thumbnail?: string;
  image?: string;
  footer?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: boolean;
}): EmbedBuilder {
  const embed = new EmbedBuilder();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.color !== undefined) embed.setColor(options.color as ColorResolvable);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.timestamp) embed.setTimestamp();
  if (options.fields) embed.addFields(options.fields);

  return embed;
}

/** Garden-themed embed (green) */
export function gardenEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `🌿 ${title}`, description, color: 0x2ecc71 });
}

/** Economy embed (gold) */
export function economyEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `🌙 ${title}`, description, color: 0xf1c40f });
}

/** Pet embed (pink) */
export function petEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `🐾 ${title}`, description, color: 0xff69b4 });
}

/** Exploration embed (teal) */
export function explorationEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `🗺️ ${title}`, description, color: 0x1abc9c });
}

/** Quest embed (blue) */
export function questEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `📜 ${title}`, description, color: 0x3498db });
}

/** Error embed (red) */
export function errorEmbed(message: string): EmbedBuilder {
  return createEmbed({ title: '❌ Lỗi', description: message, color: 0xe74c3c });
}

/** Success embed (green) */
export function successEmbed(message: string): EmbedBuilder {
  return createEmbed({ title: '✅ Thành công', description: message, color: 0x2ecc71 });
}

/** Rarity embed */
export function rarityEmbed(title: string, description: string, rarity: string): EmbedBuilder {
  return createEmbed({ title, description, color: rarityColors[rarity] ?? 0xaaaaaa });
}

/** World/weather embed (purple) */
export function worldEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `🌍 ${title}`, description, color: 0x9b59b6 });
}

/** Achievement embed (gold) */
export function achievementEmbed(title: string, description: string): EmbedBuilder {
  return createEmbed({ title: `🏆 ${title}`, description, color: 0xffd700 });
}
