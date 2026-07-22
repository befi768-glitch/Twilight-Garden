import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { PetService, PETS } from '../../services/PetService';
import { afterAdopt } from '../../systems/pets';
import { petEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { progressBar, rarityEmoji, formatCoins } from '../../utils/helpers';

const HELP = [
  '**Pet Commands:**',
  '`.pet list` — View your pets',
  '`.pet catalogue` — Browse adoptable pets',
  '`.pet adopt <type> <name>` — Adopt a pet',
  '`.pet feed <petId>` — Feed a pet',
  '`.pet play <petId>` — Play with a pet',
  '`.pet heal <petId>` — Heal a pet',
  '`.pet rename <petId> <newName>` — Rename a pet',
  '`.pet release <petId>` — Release a pet',
].join('\n');

export const command: Command = {
  name: 'pet',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'catalogue') {
      const lines = Object.values(PETS).map((p) =>
        `${rarityEmoji[p.rarity]} **${p.emoji} ${p.name}** [\`${p.id}\`] — 🌙${formatCoins(p.adoptCost)}\n> ${p.description}\n> Bonus: *${p.passiveBonus}*`
      );
      return void message.reply({ embeds: [petEmbed('Adoptable Pets', lines.join('\n\n'))] });
    }

    if (sub === 'list') {
      const pets = await PetService.getPets(player.id);
      if (!pets.length) return void message.reply({ embeds: [petEmbed('Your Pets', '*No pets yet! Use `.pet adopt` to get your first companion.*')] });
      const lines = pets.map((pet) => {
        const def = PetService.getPetDef(pet.petType);
        return `**${def?.emoji ?? '🐾'} ${pet.name}** (${def?.name ?? pet.petType}) — Lvl ${pet.level}\n🍖 Hunger: ${progressBar(pet.hunger, 100, 8)} | 😊 Happiness: ${progressBar(pet.happiness, 100, 8)}\nStatus: **${pet.status}** | ID: \`${pet.id.slice(0, 8)}\``;
      });
      return void message.reply({ embeds: [petEmbed('Your Pets', lines.join('\n\n'))] });
    }

    if (sub === 'adopt') {
      const petType = args[1];
      const name = args.slice(2).join(' ');
      if (!petType || !name) return void message.reply({ embeds: [errorEmbed('Usage: `.pet adopt <type> <name>` — Use `.pet catalogue` to see types.')] });
      try {
        const pet = await PetService.adopt(player.id, petType, name);
        await afterAdopt(player.id);
        const def = PetService.getPetDef(petType)!;
        return void message.reply({ embeds: [successEmbed(`You adopted **${def.emoji} ${pet.name}** the ${def.name}!\n*ID: \`${pet.id.slice(0, 8)}\`*\nBonus: *${def.passiveBonus}*`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    // All remaining subcommands need a petId
    const petIdInput = args[1] ?? '';
    if (!petIdInput) return void message.reply({ embeds: [errorEmbed(`Usage: \`.pet ${sub} <petId>\` — Use \`.pet list\` to see your pet IDs.`)] });

    const allPets = await PetService.getPets(player.id);
    const pet = allPets.find((p) => p.id.startsWith(petIdInput));
    if (!pet) return void message.reply({ embeds: [errorEmbed('Pet not found. Use `.pet list` to see your pet IDs.')] });

    if (sub === 'feed') {
      try {
        const updated = await PetService.feed(player.id, pet.id);
        return void message.reply({ embeds: [successEmbed(`Fed **${pet.name}**! 🍖 Hunger: ${progressBar(updated.hunger, 100)} | Status: ${updated.status}`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'play') {
      try {
        const result = await PetService.play(player.id, pet.id);
        let msg = `Played with **${pet.name}**! +${result.xpGained} XP`;
        if (result.levelUp) msg += ` 🎉 **Level up!**`;
        return void message.reply({ embeds: [successEmbed(msg)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'heal') {
      try {
        const updated = await PetService.heal(player.id, pet.id);
        return void message.reply({ embeds: [successEmbed(`Healed **${pet.name}**! Health: 100% | Status: ${updated.status}`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'rename') {
      const newName = args.slice(2).join(' ');
      if (!newName) return void message.reply({ embeds: [errorEmbed('Usage: `.pet rename <petId> <newName>`')] });
      await PetService.rename(player.id, pet.id, newName);
      return void message.reply({ embeds: [successEmbed(`Renamed pet to **${newName}**!`)] });
    }

    if (sub === 'release') {
      await PetService.release(player.id, pet.id);
      return void message.reply({ embeds: [successEmbed(`Released **${pet.name}** back into the wild. Farewell! 🌿`)] });
    }

    return void message.reply(HELP);
  },
};
