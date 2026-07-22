import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { ExplorationService, AREAS } from '../../services/ExplorationService';
import { GuildService } from '../../services/GuildService';
import { encounterWildlife } from '../../systems/wildlife';
import { explorationEmbed, errorEmbed } from '../../utils/embed';
import { AreaType } from '../../models/types';

const HELP = [
  '**Explore Commands:**',
  '`.explore areas` — List all explorable areas',
  '`.explore go <areaId>` — Explore an area',
  '`.explore history` — View your recent explorations',
].join('\n');

export const command: Command = {
  name: 'explore',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    if (sub === 'areas') {
      const lines = Object.values(AREAS).map((a) =>
        `${a.emoji} **${a.name}** [\`${a.id}\`] — Min Level: ${a.minLevel} · Energy: ⚡${a.energyCost}\n> ${a.description}`
      );
      return void message.reply({ embeds: [explorationEmbed('Explorable Areas', lines.join('\n\n'))] });
    }

    if (sub === 'go') {
      const areaId = args[1]?.toLowerCase() as AreaType;
      if (!areaId) return void message.reply({ embeds: [errorEmbed('Usage: `.explore go <areaId>` — Use `.explore areas` to see area IDs.')] });
      if (!AREAS[areaId]) return void message.reply({ embeds: [errorEmbed(`Unknown area \`${areaId}\`. Use \`.explore areas\` to see options.`)] });
      try {
        const result = await ExplorationService.explore(player.id, areaId, world);

        let wildlifeMsg = '';
        if (Math.random() < 0.4) {
          const enc = await encounterWildlife(player.id, areaId, world.currentSeason as any, world.currentWeather as any, world.timeOfDay as any, message.guildId!);
          if (enc) {
            wildlifeMsg = `\n\n🐾 **Wildlife Encounter!** You spotted a **${enc.wildlife.emoji} ${enc.wildlife.name}**${enc.isNew ? ' — *New discovery!* 🆕' : ''}`;
          }
        }

        const area = AREAS[areaId];
        const embed = explorationEmbed(`Explored: ${area.emoji} ${area.name}`, result.message + wildlifeMsg)
          .addFields(
            { name: '⚡ Energy Remaining', value: String(player.energyCurrent - area.energyCost), inline: true },
            { name: '🌤️ Weather', value: world.currentWeather, inline: true },
          );
        return void message.reply({ embeds: [embed] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'history') {
      const logs = await ExplorationService.getExplorationHistory(player.id, 8);
      if (!logs.length) return void message.reply({ embeds: [explorationEmbed('Exploration History', '*No explorations yet. Use `.explore go` to start your adventure!*')] });
      const lines = logs.map((l) => `**${l.area}** — ${l.event}\n> *<t:${Math.floor(new Date(l.exploredAt).getTime() / 1000)}:R>*`);
      return void message.reply({ embeds: [explorationEmbed('Exploration History', lines.join('\n\n'))] });
    }

    return void message.reply(HELP);
  },
};
