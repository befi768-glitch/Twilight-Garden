import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { GardenService, PLANTS } from '../../services/GardenService';
import { InventoryService } from '../../services/InventoryService';
import { GuildService } from '../../services/GuildService';
import { afterHarvest } from '../../systems/garden';
import { gardenEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { progressBar, formatDate, rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('garden')
    .setDescription('Manage your twilight garden')
    .addSubcommand((sub) => sub.setName('view').setDescription('View your garden'))
    .addSubcommand((sub) =>
      sub.setName('plant')
        .setDescription('Plant a seed in your garden')
        .addIntegerOption((o) => o.setName('slot').setDescription('Garden slot (1–20)').setRequired(true).setMinValue(1).setMaxValue(20))
        .addStringOption((o) => o.setName('plant').setDescription('Plant type').setRequired(true)
          .addChoices(...Object.values(PLANTS).map((p) => ({ name: `${p.emoji} ${p.name}`, value: p.id }))))
    )
    .addSubcommand((sub) =>
      sub.setName('water')
        .setDescription('Water a plant')
        .addIntegerOption((o) => o.setName('slot').setDescription('Slot to water').setRequired(true).setMinValue(1).setMaxValue(20))
    )
    .addSubcommand((sub) =>
      sub.setName('fertilize')
        .setDescription('Fertilize a plant')
        .addIntegerOption((o) => o.setName('slot').setDescription('Slot to fertilize').setRequired(true).setMinValue(1).setMaxValue(20))
    )
    .addSubcommand((sub) =>
      sub.setName('harvest')
        .setDescription('Harvest a mature plant')
        .addIntegerOption((o) => o.setName('slot').setDescription('Slot to harvest').setRequired(true).setMinValue(1).setMaxValue(20))
    )
    .addSubcommand((sub) =>
      sub.setName('remove')
        .setDescription('Remove a plant from a slot')
        .addIntegerOption((o) => o.setName('slot').setDescription('Slot to clear').setRequired(true).setMinValue(1).setMaxValue(20))
    )
    .addSubcommand((sub) => sub.setName('catalogue').setDescription('View all available plants')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);
    const world = await GuildService.getOrCreateWorldState(interaction.guildId!);

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
        const stageEmoji = { seed: '🌰', sprout: '🌱', growing: '🌿', mature: '🌺', flowering: '💐', withered: '💀' }[p.stage];
        const mutTag = p.isMutant ? ' ✨**MUTANT**' : '';
        slots.push(`\`${i}\` ${def?.emoji ?? '🌿'} **${def?.name ?? p.plantType}**${mutTag} ${stageEmoji} ${progressBar(p.growthPercent, 100, 8)} ${Math.round(p.growthPercent)}%`);
      }

      const embed = gardenEmbed('Your Twilight Garden', slots.join('\n') || '*No plants yet! Use `/garden plant` to get started.*')
        .addFields(
          { name: '🌤️ Weather', value: world.currentWeather, inline: true },
          { name: '🍂 Season', value: world.currentSeason, inline: true },
          { name: '🏡 Slots', value: `${plants.length}/${maxSlots}`, inline: true },
        );
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'catalogue') {
      const lines = Object.values(PLANTS).map((p) =>
        `${rarityEmoji[p.rarity]} **${p.emoji} ${p.name}** — Grows in ${p.growTimeMinutes}min · Sells for 🌙${p.sellPrice} · Seed: 🌙${p.seedPrice}\n> ${p.description}`
      );
      const embed = gardenEmbed('Plant Catalogue', lines.join('\n\n'));
      return interaction.editReply({ embeds: [embed] });
    }

    const slot = interaction.options.getInteger('slot', false) ?? 0;

    if (sub === 'plant') {
      const plantType = interaction.options.getString('plant', true);
      const def = GardenService.getPlantDef(plantType);
      if (!def) return interaction.editReply({ embeds: [errorEmbed('Unknown plant type.')] });

      // Check seed in inventory
      const hasSeed = await InventoryService.hasItem(player.id, `seed_${plantType}`, 1);
      if (!hasSeed) return interaction.editReply({ embeds: [errorEmbed(`You don't have a **${def.name} Seed** in your inventory.\nBuy one from the shop with \`/economy shop\`.`)] });

      try {
        await InventoryService.removeItem(player.id, `seed_${plantType}`, 1);
        const plant = await GardenService.plant(player.id, plantType, slot, world);
        const readyTime = plant.readyAt ? formatDate(new Date(plant.readyAt)) : 'Unknown';
        return interaction.editReply({ embeds: [successEmbed(`Planted **${def.emoji} ${def.name}** in slot ${slot}!\nReady at: \`${readyTime}\``)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'water') {
      try {
        const plant = await GardenService.water(player.id, slot);
        const def = GardenService.getPlantDef(plant.plantType);
        return interaction.editReply({ embeds: [successEmbed(`Watered **${def?.emoji ?? ''} ${def?.name ?? plant.plantType}** in slot ${slot}.\nWater level: ${progressBar(plant.waterLevel, 100)} ${Math.round(plant.waterLevel)}%`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'fertilize') {
      const hasFert = await InventoryService.hasItem(player.id, 'fertilizer', 1);
      if (!hasFert) return interaction.editReply({ embeds: [errorEmbed('You need **Fertilizer** in your inventory. Buy some from the shop!')] });
      try {
        await InventoryService.removeItem(player.id, 'fertilizer', 1);
        const plant = await GardenService.fertilize(player.id, slot);
        const def = GardenService.getPlantDef(plant.plantType);
        return interaction.editReply({ embeds: [successEmbed(`Fertilized **${def?.emoji ?? ''} ${def?.name ?? plant.plantType}** in slot ${slot}.\nFertilizer: ${progressBar(plant.fertilizerLevel, 100)} ${Math.round(plant.fertilizerLevel)}%`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'harvest') {
      try {
        const result = await GardenService.harvest(player.id, slot);
        await afterHarvest(player.id, result.yield.toString(), result.yield, result.mutant, interaction.guildId!);
        let msg = `Harvested **${result.yield}x** crop from slot ${slot}!`;
        if (result.mutant) msg += `\n✨ **MUTATION:** ${result.mutationType?.toUpperCase()} — worth far more!`;
        return interaction.editReply({ embeds: [successEmbed(msg)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'remove') {
      try {
        await GardenService.remove(player.id, slot);
        return interaction.editReply({ embeds: [successEmbed(`Removed plant from slot ${slot}.`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }
  },
};
