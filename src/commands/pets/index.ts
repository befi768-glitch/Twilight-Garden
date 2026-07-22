import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { PetService, PETS } from '../../services/PetService';
import { afterAdopt } from '../../systems/pets';
import { petEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { progressBar, rarityEmoji, formatCoins } from '../../utils/helpers';
import { checkCooldown, setCooldown, formatCooldown } from '../../utils/cooldown';

const HELP = [
  '**Lệnh Thú Cưng:**',
  '`.thuocung danhsach` — Xem thú cưng của bạn',
  '`.thuocung catalog` — Xem thú có thể nhận nuôi',
  '`.thuocung nuoi <loai> <tên>` — Nhận nuôi thú cưng',
  '`.thuocung cho_an <mãThú>` — Cho thú ăn',
  '`.thuocung choi <mãThú>` — Chơi với thú',
  '`.thuocung chua <mãThú>` — Chữa bệnh cho thú',
  '`.thuocung doi_ten <mãThú> <tên>` — Đổi tên thú',
  '`.thuocung thả <mãThú>` — Thả thú về tự nhiên',
].join('\n');

export const command: Command = {
  name: 'thuocung',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'catalog') {
      const lines = Object.values(PETS).map((p) =>
        `${rarityEmoji[p.rarity]} **${p.emoji} ${p.name}** [\`${p.id}\`] — 🌙${formatCoins(p.adoptCost)}\n> ${p.description}\n> Bonus: *${p.passiveBonus}*`
      );
      return void message.reply({ embeds: [petEmbed('Thú Có Thể Nhận Nuôi', lines.join('\n\n'))] });
    }

    if (sub === 'danhsach') {
      const pets = await PetService.getPets(player.id);
      if (!pets.length) return void message.reply({ embeds: [petEmbed('Thú Cưng Của Bạn', '*Chưa có thú cưng! Dùng `.thuocung nuoi` để nhận nuôi thú đầu tiên.*')] });
      const lines = pets.map((pet) => {
        const def = PetService.getPetDef(pet.petType);
        return `**${def?.emoji ?? '🐾'} ${pet.name}** (${def?.name ?? pet.petType}) — Cấp ${pet.level}\n🍖 Đói: ${progressBar(pet.hunger, 100, 8)} | 😊 Vui: ${progressBar(pet.happiness, 100, 8)}\nTrạng thái: **${pet.status}** | Mã: \`${pet.id.slice(0, 8)}\``;
      });
      return void message.reply({ embeds: [petEmbed('Thú Cưng Của Bạn', lines.join('\n\n'))] });
    }

    if (sub === 'nuoi') {
      const petType = args[1];
      const name = args.slice(2).join(' ').trim();
      if (!petType || !name) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.thuocung nuoi <loai> <tên>` — Dùng `.thuocung catalog` để xem các loại.')] });
      try {
        const pet = await PetService.adopt(player.id, petType, name);
        await afterAdopt(player.id);
        const def = PetService.getPetDef(petType)!;
        return void message.reply({ embeds: [successEmbed(`Bạn đã nhận nuôi **${def.emoji} ${pet.name}** loài ${def.name}!\n*Mã: \`${pet.id.slice(0, 8)}\`*\nBonus: *${def.passiveBonus}*`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    const petIdInput = args[1] ?? '';
    if (!petIdInput) return void message.reply({ embeds: [errorEmbed(`Cách dùng: \`.thuocung ${sub} <mãThú>\` — Dùng \`.thuocung danhsach\` để xem mã thú.`)] });

    const allPets = await PetService.getPets(player.id);
    const pet = allPets.find((p) => p.id.startsWith(petIdInput));
    if (!pet) return void message.reply({ embeds: [errorEmbed('Không tìm thấy thú cưng. Dùng `.thuocung danhsach` để xem mã thú.')] });

    if (sub === 'cho_an') {
      const cd = checkCooldown(message.author.id, `pet_feed_${pet.id}`, 15_000);
      if (cd > 0) return void message.reply({ embeds: [errorEmbed(`⏳ Còn **${formatCooldown(cd)}** trước khi cho ăn lại.`)] });
      setCooldown(message.author.id, `pet_feed_${pet.id}`);
      try {
        const updated = await PetService.feed(player.id, pet.id);
        return void message.reply({ embeds: [successEmbed(`Đã cho **${pet.name}** ăn! 🍖 Độ đói: ${progressBar(updated.hunger, 100)} | Trạng thái: ${updated.status}`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'choi') {
      const cd = checkCooldown(message.author.id, `pet_play_${pet.id}`, 20_000);
      if (cd > 0) return void message.reply({ embeds: [errorEmbed(`⏳ Còn **${formatCooldown(cd)}** trước khi chơi lại.`)] });
      setCooldown(message.author.id, `pet_play_${pet.id}`);
      try {
        const result = await PetService.play(player.id, pet.id);
        let msg = `Đã chơi với **${pet.name}**! +${result.xpGained} XP`;
        if (result.levelUp) msg += ` 🎉 **Lên cấp!**`;
        return void message.reply({ embeds: [successEmbed(msg)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'chua') {
      const cd = checkCooldown(message.author.id, `pet_heal_${pet.id}`, 30_000);
      if (cd > 0) return void message.reply({ embeds: [errorEmbed(`⏳ Còn **${formatCooldown(cd)}** trước khi chữa bệnh lại.`)] });
      setCooldown(message.author.id, `pet_heal_${pet.id}`);
      try {
        const updated = await PetService.heal(player.id, pet.id);
        return void message.reply({ embeds: [successEmbed(`Đã chữa bệnh cho **${pet.name}**! Sức khỏe: 100% | Trạng thái: ${updated.status}`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'doi_ten') {
      const newName = args.slice(2).join(' ').trim().slice(0, 32);
      if (!newName) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.thuocung doi_ten <mãThú> <tên mới>` — Tên không được để trống.')] });
      await PetService.rename(player.id, pet.id, newName);
      return void message.reply({ embeds: [successEmbed(`Đã đổi tên thú thành **${newName}**!`)] });
    }

    if (sub === 'thả') {
      await PetService.release(player.id, pet.id);
      return void message.reply({ embeds: [successEmbed(`Đã thả **${pet.name}** về tự nhiên. Tạm biệt! 🌿`)] });
    }

    return void message.reply(HELP);
  },
};
