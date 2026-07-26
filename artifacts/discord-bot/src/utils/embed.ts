import { EmbedBuilder, ColorResolvable } from "discord.js";

export const COLORS = {
  success: 0x57f287 as ColorResolvable,
  error: 0xed4245 as ColorResolvable,
  info: 0x5865f2 as ColorResolvable,
  warning: 0xfee75c as ColorResolvable,
  garden: 0x3ba55d as ColorResolvable,
  gold: 0xf1c40f as ColorResolvable,
  raid: 0xe74c3c as ColorResolvable,
  explore: 0x9b59b6 as ColorResolvable,
};

export function successEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle("❌ Lỗi")
    .setDescription(description);
}

export function infoEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function gardenEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.garden)
    .setTitle(`🌱 ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function goldEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function raidEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.raid)
    .setTitle(`⚔️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function exploreEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.explore)
    .setTitle(`🗺️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}
