import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { WildlifeService, WILDLIFE } from '../../services/WildlifeService';
import { GuildService } from '../../services/GuildService';
import { encounterWildlife } from '../../systems/wildlife';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { rarityEmoji, formatNumber } from '../../utils/helpers';
import { AREAS } from '../../services/ExplorationService';
import { AreaType } from '../../models/types';

const HELP = [
  '**Wildlife Commands:**',
  '`.wildlife discovered` — Your wildlife discoveries',
  '`.wildlife bestiary` — Full bestiary',
  '`.wildlife encounter` — Try to encounter a creature',
  '`.wildlife tame <creatureId>` — Attempt to tame a creature',
].join('\n');

export const command: Command = {
  name: 'wildlife',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    if (sub === 'bestiary') {
      const lines = Object.values(WILDLIFE).map((w) =>
        `${rarityEmoji[w.rarity]} **${w.emoji} ${w.name}** [\`${w.id}\`]\n> ${w.description}\n> 🏕️ ${w.habitat.join(', ')} · 🍂 ${w.season.join(', ')}`
      );
      return void message.reply({ embeds: [createEmbed({ title: '📖 Twilight Bestiary', description: lines.join('\n\n'), color: 0x27ae60 })] });
    }

    if (sub === 'discovered') {
      const discoveries = await WildlifeService.getDiscoveries(player.id);
      if (!discoveries.length) return void message.reply({ embeds: [createEmbed({ title: '🔭 Wildlife Discovered', description: '*No wildlife discovered yet. Explore different areas!*', color: 0x27ae60 })] });
      const lines = discoveries.map((d) => {
        const w = WILDLIFE[d.wildlifeId];
        return `${rarityEmoji[w?.rarity ?? 'common']} ${w?.emoji ?? '?'} **${w?.name ?? d.wildlifeId}** — Seen ${formatNumber(d.timesSeen)}x${d.tamed ? ' 🤝 *Tamed*' : ''}`;
      });
      return void message.reply({ embeds: [createEmbed({ title: `🔭 Wildlife: ${discoveries.length}/${Object.keys(WILDLIFE).length} Discovered`, description: lines.join('\n'), color: 0x27ae60 })] });
    }

    if (sub === 'encounter') {
      const result = await encounterWildlife(player.id, player.currentArea as AreaType, world.currentSeason as any, world.currentWeather as any, world.timeOfDay as any, message.guildId!);
      if (!result) {
        return void message.reply({ embeds: [createEmbed({ title: '🌿 No Encounter', description: `No wildlife spotted in **${player.currentArea}** right now.\nTry a different area or time of day!`, color: 0x27ae60 })] });
      }
      const { wildlife, isNew } = result;
      const drops = await WildlifeService.collectDrops(player.id, wildlife.id);
      let dropMsg = '';
      if (drops.length) dropMsg = '\n\n**Drops:** ' + drops.map((d) => `${d.quantity}x ${d.itemId}`).join(', ');
      return void message.reply({ embeds: [createEmbed({
        title: `${wildlife.emoji} ${wildlife.name}${isNew ? ' — New Discovery! 🆕' : ''}`,
        description: `${wildlife.description}\n*Rarity: ${rarityEmoji[wildlife.rarity]} ${wildlife.rarity}*${dropMsg}`,
        color: 0x27ae60,
      })] });
    }

    if (sub === 'tame') {
      const creatureId = args[1];
      if (!creatureId) return void message.reply({ embeds: [errorEmbed('Usage: `.wildlife tame <creatureId>` — Use `.wildlife bestiary` to see IDs.')] });
      try {
        const result = await WildlifeService.tame(player.id, creatureId);
        const embed = result.success
          ? successEmbed(result.message)
          : createEmbed({ title: '💨 Taming Failed', description: result.message, color: 0xe74c3c });
        return void message.reply({ embeds: [embed] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    return void message.reply(HELP);
  },
};
