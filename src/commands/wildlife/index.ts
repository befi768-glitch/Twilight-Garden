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
  '**Lệnh Sinh Vật:**',
  '`.wildlife dakhamppha` — Sinh vật đã khám phá',
  '`.wildlife bestiarium` — Danh sách toàn bộ sinh vật',
  '`.wildlife gap` — Thử gặp sinh vật ở khu vực hiện tại',
  '`.wildlife than <mãSinhVật>` — Thử thuần hóa sinh vật',
].join('\n');

export const command: Command = {
  name: 'wildlife',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    if (sub === 'bestiarium') {
      const lines = Object.values(WILDLIFE).map((w) =>
        `${rarityEmoji[w.rarity]} **${w.emoji} ${w.name}** [\`${w.id}\`]\n> ${w.description}\n> 🏕️ ${w.habitat.join(', ')} · 🍂 ${w.season.join(', ')}`
      );
      return void message.reply({ embeds: [createEmbed({ title: '📖 Bestiarium Hoàng Hôn', description: lines.join('\n\n'), color: 0x27ae60 })] });
    }

    if (sub === 'dakhamppha') {
      const discoveries = await WildlifeService.getDiscoveries(player.id);
      if (!discoveries.length) return void message.reply({ embeds: [createEmbed({ title: '🔭 Sinh Vật Đã Khám Phá', description: '*Chưa khám phá sinh vật nào. Hãy thám hiểm các khu vực khác nhau!*', color: 0x27ae60 })] });
      const lines = discoveries.map((d) => {
        const w = WILDLIFE[d.wildlifeId];
        return `${rarityEmoji[w?.rarity ?? 'common']} ${w?.emoji ?? '?'} **${w?.name ?? d.wildlifeId}** — Đã thấy ${formatNumber(d.timesSeen)} lần${d.tamed ? ' 🤝 *Đã thuần*' : ''}`;
      });
      return void message.reply({ embeds: [createEmbed({ title: `🔭 Sinh Vật: ${discoveries.length}/${Object.keys(WILDLIFE).length} Đã Khám Phá`, description: lines.join('\n'), color: 0x27ae60 })] });
    }

    if (sub === 'gap') {
      const result = await encounterWildlife(player.id, player.currentArea as AreaType, world.currentSeason as any, world.currentWeather as any, world.timeOfDay as any, message.guildId!);
      if (!result) {
        return void message.reply({ embeds: [createEmbed({ title: '🌿 Không Gặp Gì', description: `Không có sinh vật nào ở **${player.currentArea}** lúc này.\nThử khu vực khác hoặc thời điểm khác!`, color: 0x27ae60 })] });
      }
      const { wildlife, isNew } = result;
      const drops = await WildlifeService.collectDrops(player.id, wildlife.id);
      let dropMsg = '';
      if (drops.length) dropMsg = '\n\n**Vật phẩm rơi:** ' + drops.map((d) => `${d.quantity}x ${d.itemId}`).join(', ');
      return void message.reply({ embeds: [createEmbed({
        title: `${wildlife.emoji} ${wildlife.name}${isNew ? ' — Khám Phá Mới! 🆕' : ''}`,
        description: `${wildlife.description}\n*Độ hiếm: ${rarityEmoji[wildlife.rarity]} ${wildlife.rarity}*${dropMsg}`,
        color: 0x27ae60,
      })] });
    }

    if (sub === 'than') {
      const creatureId = args[1];
      if (!creatureId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.wildlife than <mãSinhVật>` — Dùng `.wildlife bestiarium` để xem mã.')] });
      try {
        const result = await WildlifeService.tame(player.id, creatureId);
        const embed = result.success
          ? successEmbed(result.message)
          : createEmbed({ title: '💨 Thuần Hóa Thất Bại', description: result.message, color: 0xe74c3c });
        return void message.reply({ embeds: [embed] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    return void message.reply(HELP);
  },
};
