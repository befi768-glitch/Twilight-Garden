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
  '**Garden Commands:**',
  '`.garden view` — View your garden',
  '`.garden plant <slot> <plantId>` — Plant a seed',
  '`.garden water <slot>` — Water a plant',
  '`.garden fertilize <slot>` — Fertilize a plant',
  '`.garden harvest <slot>` — Harvest a mature plant',
  '`.garden remove <slot>` — Remove a plant',
  '`.garden catalogue` — View all available plants',
].join('\n');

export const command: Command = {
  name: 'garden',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    if (sub === 'view') {
      const plants = await GardenService.getPlants(player.id);
      const { HomeService } = await import('../../services/HomeService');
      const home = await HomeService.getHome(player.id);
      const maxSlots = home?.gardenSlots ?? 6;

      const slots: string[] = [];
      for (let i = 1; i <= maxSlots; i++) {
        const p = plants.find((pl) => pl.slotIndex === i);
        if (!p) { slots.push(`\`${i}\` 🟫 *Empty*`); continue; }
        const def = GardenService.getPlantDef(p.plantType);
        const stageEmoji = { seed: '🌰', sprout: '🌱', growing: '🌿', mature: '🌺', flowering: '💐', withered: '💀' }[p.stage] ?? '🌿';
        const mutTag = p.isMutant ? ' ✨**MUTANT**' : '';
        slots.push(`\`${i}\` ${def?.emoji ?? '🌿'} **${def?.name ?? p.plantType}**${mutTag} ${stageEmoji} ${progressBar(p.growthPercent, 100, 8)} ${Math.round(p.growthPercent)}%`);
      }

      const embed = gardenEmbed('Your Twilight Garden', slots.join('\n') || '*No plants yet! Use `.garden plant` to get started.*')
        .addFields(
          { name: '🌤️ Weather', value: world.currentWeather, inline: true },
          { name: '🍂 Season', value: world.currentSeason, inline: true },
          { name: '⏰ Time', value: world.timeOfDay, inline: true },
        );
      return void message.reply({ embeds: [embed] });
    }

    if (sub === 'catalogue') {
      const lines = Object.values(PLANTS).map((p) =>
        `${rarityEmoji[p.rarity]} **${p.emoji} ${p.name}** [\`${p.id}\`]\n> ⏱️ ${p.growthTime}min · 💰${p.baseValue} · ${p.description}`
      );
      return void message.reply({ embeds: [gardenEmbed('Plant Catalogue', lines.join('\n\n'))] });
    }

    const slot = parseInt(args[1] ?? '');
    if (!slot || slot < 1 || slot > 20) return void message.reply({ embeds: [errorEmbed('Please provide a valid slot number (1–20).')] });

    if (sub === 'plant') {
      const plantId = args[2]?.toLowerCase();
      if (!plantId) return void message.reply({ embeds: [errorEmbed(`Provide a plant ID. Use \`.garden catalogue\` to see options.`)] });
      const def = GardenService.getPlantDef(plantId);
      if (!def) return void message.reply({ embeds: [errorEmbed(`Unknown plant \`${plantId}\`. Use \`.garden catalogue\` to see options.`)] });
      const hasSeed = await InventoryService.hasItem(player.id, plantId + '_seed', 1);
      if (!hasSeed) return void message.reply({ embeds: [errorEmbed(`You need **${def.name} Seeds** in your inventory. Buy from \`.economy shop\`!`)] });
      try {
        await GardenService.plant(player.id, slot, plantId);
        await InventoryService.removeItem(player.id, plantId + '_seed', 1);
        return void message.reply({ embeds: [successEmbed(`Planted **${def.emoji} ${def.name}** in slot ${slot}!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'water') {
      try {
        const plant = await GardenService.water(player.id, slot);
        const def = GardenService.getPlantDef(plant.plantType);
        return void message.reply({ embeds: [successEmbed(`Watered **${def?.emoji ?? ''} ${def?.name ?? plant.plantType}** in slot ${slot}.\nWater level: ${progressBar(plant.waterLevel, 100)} ${Math.round(plant.waterLevel)}%`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'fertilize') {
      const hasFert = await InventoryService.hasItem(player.id, 'fertilizer', 1);
      if (!hasFert) return void message.reply({ embeds: [errorEmbed('You need **Fertilizer** in your inventory. Buy some from the shop!')] });
      try {
        await InventoryService.removeItem(player.id, 'fertilizer', 1);
        const plant = await GardenService.fertilize(player.id, slot);
        const def = GardenService.getPlantDef(plant.plantType);
        return void message.reply({ embeds: [successEmbed(`Fertilized **${def?.emoji ?? ''} ${def?.name ?? plant.plantType}** in slot ${slot}.\nFertilizer: ${progressBar(plant.fertilizerLevel, 100)} ${Math.round(plant.fertilizerLevel)}%`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'harvest') {
      try {
        const result = await GardenService.harvest(player.id, slot);
        await afterHarvest(player.id, result.yield.toString(), result.yield, result.mutant, message.guildId!);
        let msg = `Harvested **${result.yield}x** crop from slot ${slot}!`;
        if (result.mutant) msg += `\n✨ **MUTATION:** ${result.mutationType?.toUpperCase()} — worth far more!`;
        return void message.reply({ embeds: [successEmbed(msg)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'remove') {
      try {
        await GardenService.remove(player.id, slot);
        return void message.reply({ embeds: [successEmbed(`Removed plant from slot ${slot}.`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    return void message.reply(HELP);
  },
};
