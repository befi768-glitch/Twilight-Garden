import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { HomeService } from '../../services/HomeService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins } from '../../utils/helpers';

const HELP = [
  '**Home Commands:**',
  '`.home view` — View your home',
  '`.home upgrade` — Upgrade your home',
  '`.home rename <name>` — Rename your home',
  '`.home describe <description>` — Set home description',
].join('\n');

export const command: Command = {
  name: 'home',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'view';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const home = await HomeService.getHome(player.id);
    if (!home) return void message.reply({ embeds: [errorEmbed('Home not found.')] });

    if (sub === 'view') {
      const nextUpgrade = HomeService.getNextUpgrade(home.level);
      return void message.reply({ embeds: [createEmbed({
        title: `🏡 ${home.name}`,
        description: home.description,
        color: 0xe67e22,
        fields: [
          { name: '⭐ Level', value: String(home.level), inline: true },
          { name: '🌱 Garden Slots', value: String(home.gardenSlots), inline: true },
          { name: '📦 Storage', value: String(home.storageSlots), inline: true },
          { name: '⬆️ Next Upgrade', value: nextUpgrade ? `${nextUpgrade.name} — ${formatCoins(nextUpgrade.cost)}` : '✅ Max Level', inline: false },
        ],
      })] });
    }

    if (sub === 'upgrade') {
      try {
        const result = await HomeService.upgrade(player.id);
        return void message.reply({ embeds: [successEmbed(`🏡 Upgraded to **Level ${result.newLevel}: ${result.tier.name}**!\n🌱 ${result.tier.gardenSlots} garden slots · 📦 ${result.tier.storageSlots} storage slots`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'rename') {
      const name = args.slice(1).join(' ').slice(0, 40);
      if (!name) return void message.reply({ embeds: [errorEmbed('Usage: `.home rename <name>`')] });
      await HomeService.setName(player.id, name);
      return void message.reply({ embeds: [successEmbed('Home name updated!')] });
    }

    if (sub === 'describe') {
      const desc = args.slice(1).join(' ').slice(0, 200);
      if (!desc) return void message.reply({ embeds: [errorEmbed('Usage: `.home describe <description>`')] });
      await HomeService.setDescription(player.id, desc);
      return void message.reply({ embeds: [successEmbed('Home description updated!')] });
    }

    return void message.reply(HELP);
  },
};
