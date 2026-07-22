import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { EconomyService } from '../../services/EconomyService';
import { InventoryService } from '../../services/InventoryService';
import { HomeService } from '../../services/HomeService';
import { GardenService } from '../../services/GardenService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Social interactions — gift, visit, trade')
    .addSubcommand((sub) =>
      sub.setName('give_coins')
        .setDescription('Give mooncoins to another player')
        .addUserOption((o) => o.setName('player').setDescription('Recipient').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('Amount to give').setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub.setName('give_item')
        .setDescription('Give an item to another player')
        .addUserOption((o) => o.setName('player').setDescription('Recipient').setRequired(true))
        .addStringOption((o) => o.setName('item').setDescription('Item ID').setRequired(true))
        .addIntegerOption((o) => o.setName('quantity').setDescription('Quantity').setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub.setName('visit')
        .setDescription("Visit another player's home")
        .addUserOption((o) => o.setName('player').setDescription('Player to visit').setRequired(true))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    const targetUser = interaction.options.getUser('player', true);
    if (targetUser.id === interaction.user.id) return interaction.editReply({ embeds: [errorEmbed('You cannot interact with yourself!')] });

    const targetPlayer = await PlayerService.getByDiscord(targetUser.id, interaction.guildId!);
    if (!targetPlayer) return interaction.editReply({ embeds: [errorEmbed(`**${targetUser.username}** has not started playing yet.`)] });

    if (sub === 'give_coins') {
      const amount = interaction.options.getInteger('amount', true);
      try {
        await EconomyService.transfer(player.id, targetPlayer.id, amount);
        return interaction.editReply({ embeds: [successEmbed(`Gave **${formatCoins(amount)}** to **${targetUser.username}**! 🎁`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'give_item') {
      const itemId = interaction.options.getString('item', true);
      const qty = interaction.options.getInteger('quantity') ?? 1;
      const has = await InventoryService.hasItem(player.id, itemId, qty);
      if (!has) return interaction.editReply({ embeds: [errorEmbed(`You don't have ${qty}x ${itemId} in your inventory.`)] });
      await InventoryService.removeItem(player.id, itemId, qty);
      await InventoryService.addItem(targetPlayer.id, itemId, qty);
      const { ITEMS } = await import('../../services/EconomyService');
      const def = ITEMS[itemId];
      return interaction.editReply({ embeds: [successEmbed(`Gave **${qty}x ${def?.emoji ?? ''} ${def?.name ?? itemId}** to **${targetUser.username}**! 🎁`)] });
    }

    if (sub === 'visit') {
      const home = await HomeService.getHome(targetPlayer.id);
      if (!home) return interaction.editReply({ embeds: [errorEmbed(`${targetUser.username} doesn't have a home yet.`)] });
      const garden = await GardenService.getPlants(targetPlayer.id);

      const embed = createEmbed({
        title: `🏡 ${home.name}`,
        description: home.description,
        color: 0xe67e22,
        fields: [
          { name: '⭐ Home Level', value: String(home.level), inline: true },
          { name: '🌱 Garden', value: `${garden.length} plants growing`, inline: true },
          { name: '🌙 Coins', value: formatCoins(targetPlayer.coins), inline: true },
        ],
        footer: `Visiting ${targetUser.username}'s home`,
      });
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
