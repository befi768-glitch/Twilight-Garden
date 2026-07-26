import { randomInt } from "../utils/helpers";
import { SEEDS } from "../data/seeds";
import { addToInventory } from "./garden";
import { addCoins } from "./economy";

export type ExploreLocation = "forest" | "desert" | "mountain" | "swamp" | "ruins";

export interface ExploreResult {
  location: string;
  emoji: string;
  story: string;
  coins: number;
  items: Array<{ id: string; qty: number; name: string; emoji: string }>;
  exp: number;
}

const LOCATIONS: Record<ExploreLocation, { name: string; emoji: string; stories: string[] }> = {
  forest: {
    name: "Rừng Hoang",
    emoji: "🌲",
    stories: [
      "Bạn phát hiện một khu vực cây rừng rậm và tìm thấy nhiều hạt giống hoang dã!",
      "Một con nai dẫn bạn đến vùng đất phì nhiêu ẩn sâu trong rừng.",
      "Bạn gặp một lều trại bỏ hoang với nhiều vật phẩm hữu ích bên trong.",
    ],
  },
  desert: {
    name: "Sa Mạc Cát Vàng",
    emoji: "🏜️",
    stories: [
      "Giữa cát vàng, bạn tìm thấy ốc đảo xanh tươi với hạt giống quý hiếm!",
      "Một thương đoàn cũ bỏ lại nhiều vật phẩm trong đống đổ nát.",
      "Dưới ánh mặt trời chói chang, bạn đào được túi tiền bị chôn giấu.",
    ],
  },
  mountain: {
    name: "Núi Tuyết Phủ",
    emoji: "⛰️",
    stories: [
      "Trên đỉnh núi tuyết, bạn gặp một ẩn sĩ tặng bạn hạt giống thần kỳ!",
      "Hang động bí mật chứa đầy khoáng sản và tiền cổ.",
      "Bạn giải cứu một thương nhân và được thưởng hậu hĩnh.",
    ],
  },
  swamp: {
    name: "Đầm Lầy Bí Ẩn",
    emoji: "🌿",
    stories: [
      "Giữa đầm lầy, bạn tìm thấy cây nấm khổng lồ phát sáng ma quái.",
      "Một phù thủy già ban cho bạn bình thuốc đặc biệt.",
      "Bạn tìm thấy kho báu chìm dưới bùn lầy.",
    ],
  },
  ruins: {
    name: "Phế Tích Cổ Đại",
    emoji: "🏛️",
    stories: [
      "Bên trong phế tích, bạn giải được câu đố cổ đại và nhận phần thưởng.",
      "Bức tường cổ khắc bản đồ dẫn đến kho báu bí ẩn.",
      "Bạn khám phá thư viện cổ và học được bí kíp trồng trọt quý giá.",
    ],
  },
};

export async function explore(
  playerId: number,
  petPassives: string[],
): Promise<ExploreResult> {
  const locationKeys = Object.keys(LOCATIONS) as ExploreLocation[];
  const locKey = locationKeys[Math.floor(Math.random() * locationKeys.length)]!;
  const loc = LOCATIONS[locKey];

  const story = loc.stories[Math.floor(Math.random() * loc.stories.length)]!;

  let coins = randomInt(20, 120);
  let exp = randomInt(10, 30);
  const items: ExploreResult["items"] = [];

  if (petPassives.includes("explore_boost")) {
    coins = Math.ceil(coins * 1.2);
    exp = Math.ceil(exp * 1.2);
  }

  // Random item finds
  const roll = Math.random();
  if (roll < 0.4) {
    // Common seed
    const commonSeeds = Object.values(SEEDS).filter(s => s.rarity === "common");
    const seed = commonSeeds[Math.floor(Math.random() * commonSeeds.length)]!;
    const qty = randomInt(1, 3);
    items.push({ id: `seed_${seed.id}`, qty, name: seed.name, emoji: seed.emoji });
  } else if (roll < 0.65) {
    // Uncommon seed
    const uncommon = Object.values(SEEDS).filter(s => s.rarity === "uncommon");
    const seed = uncommon[Math.floor(Math.random() * uncommon.length)]!;
    items.push({ id: `seed_${seed.id}`, qty: 1, name: seed.name, emoji: seed.emoji });
  } else if (roll < 0.80) {
    // Rare seed
    const rare = Object.values(SEEDS).filter(s => s.rarity === "rare");
    if (rare.length > 0) {
      const seed = rare[Math.floor(Math.random() * rare.length)]!;
      items.push({ id: `seed_${seed.id}`, qty: 1, name: seed.name, emoji: seed.emoji });
    }
  } else if (roll < 0.85) {
    // Legendary!
    const legendary = Object.values(SEEDS).filter(s => s.rarity === "legendary");
    if (legendary.length > 0) {
      const seed = legendary[Math.floor(Math.random() * legendary.length)]!;
      items.push({ id: `seed_${seed.id}`, qty: 1, name: seed.name, emoji: seed.emoji });
      coins += 50;
    }
  } else if (roll < 0.95) {
    // Fertilizer
    items.push({ id: "fertilizer", qty: randomInt(1, 2), name: "Phân bón", emoji: "💩" });
  }
  // else: coins only

  // Apply rewards
  await addCoins(playerId, coins, exp);
  for (const item of items) {
    await addToInventory(playerId, item.id, item.qty);
  }

  return { location: loc.name, emoji: loc.emoji, story, coins, items, exp };
}
