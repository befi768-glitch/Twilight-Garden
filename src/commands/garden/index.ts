import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { GardenService, PLANTS } from '../../services/GardenService';
import { InventoryService } from '../../services/InventoryService';
import { GuildService } from '../../services/GuildService';
import { afterHarvest } from '../../systems/garden';
import { gardenEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { progressBar, rarityEmoji } from '../../utils/helpers';

const HELP = [
  '**Lệnh Vườn:**',
  '`.garden xem` — Xem vườn của bạn',
  '`.garden trồng <ô> <loạiCây>` — Trồng hạt giống',
  '`.garden tưới <ô>` — Tưới nước cho cây',
  '`.garden bón <ô>` — Bón phân cho cây',
  '`.garden thu <ô>` — Thu hoạch cây trưởng thành',
  '`.garden nhổ <ô>` — Nhổ bỏ cây',
  '`.garden danh_sach` — Xem danh sách các loại cây',
].join('\n');

export const command: Command = {
  name: 'garden',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    if (sub === 'xem') {
      const plants = await GardenService.getPlants(player.id);
      const { HomeService } = await import('../../services/HomeService');
      const home = await HomeService.getHome(player.id);
      const maxSlots = home?.gardenSlots ?? 6;

      const slots: string[] = [];
      for (let i = 1; i <= maxSlots; i++) {
        const p = plants.find((pl) => pl.slotIndex === i);
        if (!p) { slots.push(`\`${i}\` 🟫 *Trống*`); continue; }
        const def = GardenService.getPlantDef(p.plantType);
        const stageEmoji = { seed: '🌰', sprout: '🌱', growing: '🌿', mature: '🌺', flowering: '💐', withered: '💀' }[p.stage] ?? '🌿';
        const mutTag = p.isMutant ? ' ✨**ĐỘT BIẾN**' : '';
        slots.push(`\`${i}\` ${def?.emoji ?? '🌿'} **${def?.name ?? p.plantType}**${mutTag} ${stageEmoji} ${progressBar(p.growthPercent, 100, 8)} ${Math.round(p.growthPercent)}%`);
      }

      const embed = gardenEmbed('Vườn Hoàng Hôn Của Bạn', slots.join('\n') || '*Chưa có cây nào! Dùng `.garden trồng` để bắt đầu.*')
        .addFields(
          { name: '🌤️ Thời tiết', value: world.currentWeather, inline: true },
          { name: '🍂 Mùa', value: world.currentSeason, inline: true },
          { name: '⏰ Thời điểm', value: world.timeOfDay, inline: true },
        );
      return void message.reply({ embeds: [embed] });
    }

    if (sub === 'danh_sach') {
      const lines = Object.values(PLANTS).map((p) =>
        `${rarityEmoji[p.rarity]} **${p.emoji} ${p.name}** [\`${p.id}\`]\n> ⏱️ ${p.growthTime} phút · 💰${p.baseValue} · ${p.description}`
      );
      return void message.reply({ embeds: [gardenEmbed('Danh Sách Cây Trồng', lines.join('\n\n'))] });
    }

    const slot = parseInt(args[1] ?? '');
    if (!slot || slot < 1 || slot > 20) return void message.reply({ embeds: [errorEmbed('Vui lòng nhập số ô hợp lệ (1–20).')] });

    if (sub === 'trồng') {
      const plantId = args[2]?.toLowerCase();
      if (!plantId) return void message.reply({ embeds: [errorEmbed(`Thiếu loại cây. Dùng \`.garden danh_sach\` để xem các loại.`)] });
      const def = GardenService.getPlantDef(plantId);
      if (!def) return void message.reply({ embeds: [errorEmbed(`Không tìm thấy cây \`${plantId}\`. Dùng \`.garden danh_sach\` để xem.`)] });
      const hasSeed = await InventoryService.hasItem(player.id, plantId + '_seed', 1);
      if (!hasSeed) return void message.reply({ embeds: [errorEmbed(`Bạn cần **Hạt giống ${def.name}** trong túi đồ. Mua tại \`.economy shop\`!`)] });
      try {
        await GardenService.plant(player.id, slot, plantId);
        await InventoryService.removeItem(player.id, plantId + '_seed', 1);
        return void message.reply({ embeds: [successEmbed(`Đã trồng **${def.emoji} ${def.name}** vào ô ${slot}!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'tưới') {
      try {
        const plant = await GardenService.water(player.id, slot);
        const def = GardenService.getPlantDef(plant.plantType);
        return void message.reply({ embeds: [successEmbed(`Đã tưới **${def?.emoji ?? ''} ${def?.name ?? plant.plantType}** ở ô ${slot}.\nLượng nước: ${progressBar(plant.waterLevel, 100)} ${Math.round(plant.waterLevel)}%`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'bón') {
      const hasFert = await InventoryService.hasItem(player.id, 'fertilizer', 1);
      if (!hasFert) return void message.reply({ embeds: [errorEmbed('Bạn cần **Phân bón** trong túi đồ. Mua tại cửa hàng!')] });
      try {
        await InventoryService.removeItem(player.id, 'fertilizer', 1);
        const plant = await GardenService.fertilize(player.id, slot);
        const def = GardenService.getPlantDef(plant.plantType);
        return void message.reply({ embeds: [successEmbed(`Đã bón phân cho **${def?.emoji ?? ''} ${def?.name ?? plant.plantType}** ở ô ${slot}.\nPhân bón: ${progressBar(plant.fertilizerLevel, 100)} ${Math.round(plant.fertilizerLevel)}%`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'thu') {
      try {
        const result = await GardenService.harvest(player.id, slot);
        await afterHarvest(player.id, result.yield.toString(), result.yield, result.mutant, message.guildId!);
        let msg = `Thu hoạch được **${result.yield}x** sản phẩm từ ô ${slot}!`;
        if (result.mutant) msg += `\n✨ **ĐỘT BIẾN:** ${result.mutationType?.toUpperCase()} — giá trị cực cao!`;
        return void message.reply({ embeds: [successEmbed(msg)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'nhổ') {
      try {
        await GardenService.remove(player.id, slot);
        return void message.reply({ embeds: [successEmbed(`Đã nhổ bỏ cây ở ô ${slot}.`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    return void message.reply(HELP);
  },
};
