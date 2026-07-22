import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { PetService, PETS } from '../../services/PetService';
import { afterAdopt } from '../../systems/pets';
import { petEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { progressBar, rarityEmoji, formatCoins } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Manage your pets')
    .addSubcommand((sub) => sub.setName('list').setDescription('View your pets'))
    .addSubcommand((sub) => sub.setName('catalogue').setDescription('Browse adoptable pets'))
    .addSubcommand((sub) =>
      sub.setName('adopt')
        .setDescription('Adopt a new pet')
        .addStringOption((o) => o.setName('type').setDescription('Pet type').setRequired(true)
          .addChoices(...Object.values(PETS).map((p) => ({ name: `${p.emoji} ${p.name}`, value: p.id }))))
        .addStringOption((o) => o.setName('name').setDescription('Name your pet').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('feed')
        .setDescription('Feed a pet (uses 1 Pet Food)')
        .addStringOption((o) => o.setName('pet_id').setDescription('Pet ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('play')
        .setDescription('Play with a pet')
        .addStringOption((o) => o.setName('pet_id').setDescription('Pet ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('heal')
        .setDescription('Heal a sick pet (uses 1 Healing Herb)')
        .addStringOption((o) => o.setName('pet_id').setDescription('Pet ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('rename')
        .setDescription('Rename a pet')
        .addStringOption((o) => o.setName('pet_id').setDescription('Pet ID').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('release')
        .setDescription('Release a pet back to the wild')
        .addStringOption((o) => o.setName('pet_id').setDescription('Pet ID').setRequired(true))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'catalogue') {
      const lines = Object.values(PETS).map((p) =>
        `${rarityEmoji[p.rarity]} **${p.emoji} ${p.name}** — 🌙${formatCoins(p.adoptCost)}\n> ${p.description}\n> Bonus: *${p.passiveBonus}*`
      );
      return interaction.editReply({ embeds: [petEmbed('Adoptable Pets', lines.join('\n\n'))] });
    }

    if (sub === 'list') {
      const pets = await PetService.getPets(player.id);
      if (!pets.length) return interaction.editReply({ embeds: [petEmbed('Your Pets', '*No pets yet! Use `/pet adopt` to get your first companion.*')] });

      const lines = pets.map((pet) => {
        const def = PetService.getPetDef(pet.petType);
        return `**${def?.emoji ?? '🐾'} ${pet.name}** (${def?.name ?? pet.petType}) — Lvl ${pet.level}\n🍖 Hunger: ${progressBar(pet.hunger, 100, 8)} | 😊 Happiness: ${progressBar(pet.happiness, 100, 8)}\nStatus: **${pet.status}** | ID: \`${pet.id.slice(0, 8)}\``;
      });

      return interaction.editReply({ embeds: [petEmbed('Your Pets', lines.join('\n\n'))] });
    }

    if (sub === 'adopt') {
      const petType = interaction.options.getString('type', true);
      const name = interaction.options.getString('name', true);
      try {
        const pet = await PetService.adopt(player.id, petType, name);
        await afterAdopt(player.id);
        const def = PetService.getPetDef(petType)!;
        return interaction.editReply({ embeds: [successEmbed(`You adopted **${def.emoji} ${pet.name}** the ${def.name}!\n*ID: \`${pet.id.slice(0, 8)}\`*\nBonus: *${def.passiveBonus}*`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    const petIdInput = interaction.options.getString('pet_id', false) ?? '';
    const allPets = await PetService.getPets(player.id);
    const pet = allPets.find((p) => p.id.startsWith(petIdInput));
    if (sub !== 'list' && sub !== 'catalogue' && sub !== 'adopt' && !pet) {
      return interaction.editReply({ embeds: [errorEmbed('Pet not found. Use `/pet list` to see your pet IDs.')] });
    }

    if (sub === 'feed') {
      try {
        const updated = await PetService.feed(player.id, pet!.id);
        return interaction.editReply({ embeds: [successEmbed(`Fed **${pet!.name}**! 🍖 Hunger: ${progressBar(updated.hunger, 100)} | Status: ${updated.status}`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'play') {
      try {
        const result = await PetService.play(player.id, pet!.id);
        let msg = `Played with **${pet!.name}**! +${result.xpGained} XP`;
        if (result.levelUp) msg += ` 🎉 **Level up!**`;
        return interaction.editReply({ embeds: [successEmbed(msg)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'heal') {
      try {
        const updated = await PetService.heal(player.id, pet!.id);
        return interaction.editReply({ embeds: [successEmbed(`Healed **${pet!.name}**! Health: 100% | Status: ${updated.status}`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'rename') {
      const newName = interaction.options.getString('name', true);
      await PetService.rename(player.id, pet!.id, newName);
      return interaction.editReply({ embeds: [successEmbed(`Renamed pet to **${newName}**!`)] });
    }

    if (sub === 'release') {
      await PetService.release(player.id, pet!.id);
      return interaction.editReply({ embeds: [successEmbed(`Released **${pet!.name}** back into the wild. Farewell! 🌿`)] });
    }
  },
};
